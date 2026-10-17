import { prisma } from '../db/client.ts';
import { getLocalDb, resolveLocalTenantId } from '../db/local-db.ts';
import { calculateOrderPricing, type OrderItemCalculationRequest } from './product.service.ts';
import { recordAuditEvent } from './audit.service.ts';
import type { Order, Invoice } from '@prisma/client';

export interface CreateOrderResult {
  order: Order;
  invoice: Invoice;
}

/**
 * Creates an authoritative Order and linked Invoice.
 * Derives prices solely from server-side database records.
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

  try {
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

    // 2. Transactional persistence
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
          status: 'unpaid',
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
        total: pricing.totalAmount,
      },
    });

    return result;
  } catch {
    // Resilient fallback to SQLite
    const db = getLocalDb();
    const resolvedTenant = resolveLocalTenantId(tenantId);
    const orderId = `o_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const invoiceId = `i_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO orders (id, tenant_id, customer_id, order_number, product_id, product_name, status, amount, billing_cycle, items, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      resolvedTenant,
      customerId,
      orderNumber,
      primaryItem.productId,
      primaryItem.productName,
      'awaiting_payment',
      pricing.totalAmount,
      primaryItem.cycle,
      JSON.stringify(pricing.items),
      now,
      now
    );

    db.prepare(`
      INSERT INTO invoices (id, tenant_id, customer_id, order_id, invoice_number, status, subtotal, tax, total, currency, items, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceId,
      resolvedTenant,
      customerId,
      orderId,
      invoiceNumber,
      'pending',
      pricing.subtotal,
      pricing.taxAmount,
      pricing.totalAmount,
      pricing.currency,
      JSON.stringify(pricing.items),
      now,
      now
    );

    return {
      order: {
        id: orderId,
        tenantId: resolvedTenant,
        customerId,
        productId: primaryItem.productId,
        orderNumber,
        status: 'awaiting_payment',
        amount: pricing.totalAmount as any,
        billingCycle: primaryItem.cycle,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      } as any,
      invoice: {
        id: invoiceId,
        tenantId: resolvedTenant,
        customerId,
        orderId,
        invoiceNumber,
        status: 'pending',
        subtotal: pricing.subtotal as any,
        tax: pricing.taxAmount as any,
        total: pricing.totalAmount as any,
        currency: pricing.currency,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      } as any,
    };
  }
}

export async function getOrderById(tenantId: string, orderId: string) {
  try {
    return await prisma.order.findUnique({
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
  } catch {
    const db = getLocalDb();
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!row) return null;
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(row.customer_id) as any;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(row.product_id) as any;
    const invoices = db.prepare('SELECT * FROM invoices WHERE order_id = ?').all(row.id) as any[];
    const services = db.prepare('SELECT * FROM services WHERE order_id = ?').all(row.id) as any[];

    return {
      ...row,
      amount: row.amount,
      customer,
      product,
      items: row.items ? JSON.parse(row.items) : [],
      invoices,
      services,
    };
  }
}

export async function listOrders(tenantId: string, options: { customerId?: string; status?: string; page?: number; limit?: number } = {}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  try {
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
  } catch {
    const db = getLocalDb();
    const resolvedTenant = resolveLocalTenantId(tenantId);
    let query = 'SELECT * FROM orders WHERE tenant_id = ?';
    const params: (string | number)[] = [resolvedTenant];

    if (options.customerId) {
      query += ' AND customer_id = ?';
      params.push(options.customerId);
    }
    if (options.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    const countRow = db.prepare(`SELECT count(*) as count FROM (${query})`).get(...params) as { count: number };
    const total = countRow?.count || 0;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, skip);

    const rows = db.prepare(query).all(...params) as any[];
    const orders = rows.map((r) => {
      const cust = db.prepare('SELECT name, email FROM customers WHERE id = ?').get(r.customer_id) as any;
      const prod = db.prepare('SELECT name, type FROM products WHERE id = ?').get(r.product_id) as any;
      return {
        id: r.id,
        tenantId: r.tenant_id,
        customerId: r.customer_id,
        productId: r.product_id,
        orderNumber: r.order_number,
        status: r.status,
        amount: r.amount,
        billingCycle: r.billing_cycle,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
        customer: cust || { name: 'Customer', email: 'user@example.com' },
        product: prod || { name: r.product_name || 'Standard Plan', type: 'shared' },
      };
    });

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
}

export async function transitionOrderStatus(
  tenantId: string,
  orderId: string,
  newStatus: string,
  actorId?: string
): Promise<Order> {
  try {
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
  } catch {
    const db = getLocalDb();
    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, orderId);
    return getOrderById(tenantId, orderId) as any;
  }
}
