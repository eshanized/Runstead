import { prisma } from '../db/client.ts';
import { calculateOrderPricing, type OrderItemCalculationRequest } from './product.service.ts';
import { recordAuditEvent } from './audit.service.ts';
import type { Order, Invoice } from '@prisma/client';

export interface CreateOrderResult {
  order: Order;
  invoice: Invoice;
}

/**
 * Creates an authoritative Order and linked Invoice in PostgreSQL.
 * Derives prices solely from server-side database records.
 */
export async function createOrder(
  tenantId: string,
  customerId: string,
  items: OrderItemCalculationRequest[],
  actorId?: string
): Promise<CreateOrderResult> {
  // 1. Verify customer belongs to this tenant
  const customer = await prisma.customer.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: customerId,
      },
    },
  });

  if (!customer) {
    throw new Error(`Customer not found in tenant: ${customerId}`);
  }

  // 2. Authoritative Server-side pricing calculation
  const pricing = await calculateOrderPricing(tenantId, items);

  const timestamp = Date.now().toString().slice(-6);
  const randomSuffix = Math.floor(Math.random() * 900 + 100);
  const orderNumber = `ORD-${timestamp}-${randomSuffix}`;
  const invoiceNumber = `INV-${timestamp}-${randomSuffix}`;

  const primaryItem = pricing.items[0];

  // 3. Transactional persistence
  const result = await prisma.$transaction(async (tx) => {
    // A. Create Order
    const order = await tx.order.create({
      data: {
        tenantId,
        customerId,
        productId: primaryItem.productId,
        orderNumber,
        status: 'awaiting_payment',
        amount: pricing.totalAmount,
        billingCycle: primaryItem.cycle,
      },
    });

    // B. Create Order Items
    for (const item of pricing.items) {
      await tx.orderItem.create({
        data: {
          tenantId,
          orderId: order.id,
          productId: item.productId,
          description: `${item.productName} (${item.cycle})${item.setupFee > 0 ? ` + Setup Fee ($${item.setupFee})` : ''}`,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.totalAmount,
        },
      });
    }

    // C. Create linked Invoice
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7-day payment window

    const invoice = await tx.invoice.create({
      data: {
        tenantId,
        customerId,
        orderId: order.id,
        invoiceNumber,
        status: 'unpaid',
        dueDate,
        currency: pricing.currency,
        subtotal: pricing.subtotal,
        taxRate: pricing.taxRate,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
      },
    });

    // D. Create Invoice Items
    for (const item of pricing.items) {
      await tx.invoiceItem.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          description: `${item.productName} - ${item.cycle}`,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.totalAmount,
        },
      });
    }

    return { order, invoice };
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'order.created',
    resourceType: 'order',
    resourceId: result.order.id,
    payload: {
      orderNumber,
      invoiceNumber,
      amount: pricing.totalAmount,
      itemsCount: pricing.items.length,
    },
  });

  return result;
}

export async function getOrderById(tenantId: string, orderId: string) {
  return prisma.order.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: orderId,
      },
    },
    include: {
      customer: true,
      product: true,
      items: true,
      invoices: true,
      services: true,
    },
  });
}

export async function listOrders(tenantId: string, options: { customerId?: string; status?: string; page?: number; limit?: number } = {}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where = {
    tenantId,
    customerId: options.customerId,
    status: options.status,
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
        product: { select: { name: true, type: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function transitionOrderStatus(
  tenantId: string,
  orderId: string,
  newStatus: string,
  actorId?: string
): Promise<Order> {
  const updated = await prisma.order.update({
    where: {
      tenantId_id: {
        tenantId,
        id: orderId,
      },
    },
    data: { status: newStatus },
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: `order.status_${newStatus}`,
    resourceType: 'order',
    resourceId: orderId,
    payload: { status: newStatus },
  });

  return updated;
}
