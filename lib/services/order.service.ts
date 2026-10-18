import { withTenantContext } from '../db/client.ts';
import { calculateOrderPricing, type OrderItemCalculationRequest } from './product.service.ts';
import { recordAuditEvent } from './audit.service.ts';
import type { Order, Invoice, Prisma } from '@prisma/client';

export interface CreateOrderResult {
  order: Order;
  invoice: Invoice & { total?: number };
}

/**
 * Creates an authoritative Order and linked Invoice.
 * Derives prices solely from server-side database records in PostgreSQL.
 */
export async function createOrder(
  tenantId: string,
  customerId: string,
  items: OrderItemCalculationRequest[],
  actorId?: string
): Promise<CreateOrderResult> {
  const timestamp = Date.now().toString().slice(-6);
  const randomSuffix = Math.floor(Math.random() * 900 + 100);
  const orderNumber = `ORD-${timestamp}-${randomSuffix}`;
  const invoiceNumber = `INV-${timestamp}-${randomSuffix}`;

  const pricing = await calculateOrderPricing(tenantId, items);
  const primaryItem = pricing.items[0];

  // 1. Verify customer belongs to this tenant in PostgreSQL
  const customer = await withTenantContext(tenantId, (tx) => tx.customer.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: customerId,
      },
    },
  }));

  if (!customer) {
    throw new Error(`Customer not found in tenant: ${customerId}`);
  }

  // 2. Transactional persistence in PostgreSQL
  const result = await withTenantContext(tenantId, async (tx) => {
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
    await tx.orderItem.createMany({
      data: pricing.items.map((item) => ({
        tenantId,
        orderId: order.id,
        productId: item.productId,
        description: `${item.productName} (${item.cycle})`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.totalAmount,
      })),
    });

    // C. Create linked Invoice
    const invoice = await tx.invoice.create({
      data: {
        tenantId,
        customerId,
        orderId: order.id,
        invoiceNumber,
        status: 'pending',
        subtotal: pricing.subtotal,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
        currency: pricing.currency,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Net 14 days
      },
    });

    // D. Create Invoice Line Items
    await tx.invoiceItem.createMany({
      data: pricing.items.map((item) => ({
        tenantId,
        invoiceId: invoice.id,
        description: `${item.productName} (${item.cycle})`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.totalAmount,
      })),
    });

    return {
      order,
      invoice: Object.assign(invoice, { total: Number(invoice.totalAmount) }),
    };
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'order.created',
    resourceType: 'order',
    resourceId: result.order.id,
    payload: {
      orderNumber,
      invoiceNumber,
      total: pricing.totalAmount,
    },
  });

  return result;
}

export async function getOrderById(tenantId: string, orderId: string) {
  return withTenantContext(tenantId, (tx) => tx.order.findUnique({
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
  }));
}

export async function listOrders(
  tenantId: string,
  options: { customerId?: string; status?: string; page?: number; limit?: number } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {
    tenantId,
    customerId: options.customerId,
    status: options.status,
  };

  const [orders, total] = await withTenantContext(tenantId, async (tx) => Promise.all([
    tx.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
        product: { select: { name: true, type: true } },
      },
    }),
    tx.order.count({ where }),
  ]));

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
  const updated = await withTenantContext(tenantId, (tx) => tx.order.update({
    where: {
      tenantId_id: {
        tenantId,
        id: orderId,
      },
    },
    data: { status: newStatus },
  }));

  await recordAuditEvent(tenantId, {
    actorId,
    action: `order.status_${newStatus}`,
    resourceType: 'order',
    resourceId: orderId,
    payload: { status: newStatus },
  });

  return updated;
}
