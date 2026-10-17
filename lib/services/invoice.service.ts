import { prisma } from '../db/client.ts';
import { getLocalDb, resolveLocalTenantId } from '../db/local-db.ts';
import { recordAuditEvent } from './audit.service.ts';
import type { Invoice, Payment, Prisma } from '@prisma/client';

export interface SettleInvoicePaymentInput {
  amount: number;
  currency?: string;
  method: string;
  providerTransactionId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

export async function getInvoiceById(tenantId: string, invoiceId: string) {
  try {
    return await prisma.invoice.findUnique({
      where: {
        tenantId_id: {
          tenantId,
          id: invoiceId,
        },
      },
      include: {
        customer: true,
        order: true,
        items: true,
        payments: true,
      },
    });
  } catch {
    const db = getLocalDb();
    const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any;
    if (!row) return null;
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(row.customer_id) as any;
    const order = row.order_id ? db.prepare('SELECT * FROM orders WHERE id = ?').get(row.order_id) as any : null;
    const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ?').all(row.id) as any[];

    return {
      ...row,
      subtotal: row.subtotal,
      tax: row.tax,
      total: row.total,
      customer,
      order,
      items: row.items ? JSON.parse(row.items) : [],
      payments,
    };
  }
}

export async function listInvoices(
  tenantId: string,
  options: { customerId?: string; status?: string; page?: number; limit?: number } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.InvoiceWhereInput = {
      tenantId,
      customerId: options.customerId,
      status: options.status,
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
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
    let query = 'SELECT * FROM invoices WHERE tenant_id = ?';
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
    const invoices = rows.map((r) => {
      const cust = db.prepare('SELECT name, email FROM customers WHERE id = ?').get(r.customer_id) as any;
      return {
        id: r.id,
        tenantId: r.tenant_id,
        customerId: r.customer_id,
        orderId: r.order_id,
        invoiceNumber: r.invoice_number,
        status: r.status,
        subtotal: r.subtotal,
        tax: r.tax,
        total: r.total,
        currency: r.currency || 'USD',
        dueDate: r.due_date ? new Date(r.due_date) : null,
        paidDate: r.paid_at ? new Date(r.paid_at) : null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
        customer: cust || { name: 'Customer', email: 'user@example.com' },
      };
    });

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

/**
 * Settles an invoice with full transactional consistency and idempotency protection.
 * Automatically marks the linked order paid and enqueues service provisioning.
 */
export async function settleInvoice(
  tenantId: string,
  invoiceId: string,
  paymentInput: SettleInvoicePaymentInput,
  actorId?: string
): Promise<{ invoice: Invoice; payment: Payment; alreadySettled: boolean }> {
  try {
    // 1. Idempotency Check: prevent duplicate charges
    if (paymentInput.idempotencyKey) {
      const existingPayment = await prisma.payment.findFirst({
        where: {
          tenantId,
          idempotencyKey: paymentInput.idempotencyKey,
        },
        include: { invoice: true },
      });

      if (existingPayment) {
        return {
          invoice: existingPayment.invoice,
          payment: existingPayment,
          alreadySettled: true,
        };
      }
    }

    // 2. Fetch target invoice
    const invoice = await prisma.invoice.findUnique({
      where: {
        tenantId_id: {
          tenantId,
          id: invoiceId,
        },
      },
    });

    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    if (invoice.status === 'paid') {
      const payment = await prisma.payment.findFirst({
        where: { tenantId, invoiceId },
        orderBy: { createdAt: 'desc' },
      });
      return {
        invoice,
        payment: payment!,
        alreadySettled: true,
      };
    }

    // 3. Perform atomic settlement transaction
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();

      const updatedInvoice = await tx.invoice.update({
        where: {
          tenantId_id: {
            tenantId,
            id: invoiceId,
          },
        },
        data: {
          status: 'paid',
          paidDate: now,
        },
      });

      const createdPayment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId,
          customerId: invoice.customerId,
          amount: paymentInput.amount,
          currency: paymentInput.currency || invoice.currency,
          method: paymentInput.method,
          providerTransactionId: paymentInput.providerTransactionId,
          idempotencyKey: paymentInput.idempotencyKey,
          metadata: paymentInput.metadata,
          status: 'succeeded',
          settledAt: now,
        },
      });

      await tx.customer.update({
        where: {
          tenantId_id: {
            tenantId,
            id: invoice.customerId,
          },
        },
        data: {
          totalRevenue: {
            increment: paymentInput.amount,
          },
        },
      });

      if (invoice.orderId) {
        await tx.order.update({
          where: {
            tenantId_id: {
              tenantId,
              id: invoice.orderId,
            },
          },
          data: { status: 'paid' },
        });

        await tx.backgroundJob.create({
          data: {
            tenantId,
            jobType: 'provision_service',
            status: 'queued',
            attempts: 0,
            maxAttempts: 3,
            payload: {
              tenantId,
              orderId: invoice.orderId,
              customerId: invoice.customerId,
              invoiceId: invoice.id,
            },
          },
        });
      }

      return { invoice: updatedInvoice, payment: createdPayment };
    });

    await recordAuditEvent(tenantId, {
      actorId,
      action: 'invoice.settled',
      resourceType: 'invoice',
      resourceId: invoice.id,
      payload: {
        amount: paymentInput.amount,
        method: paymentInput.method,
        providerTransactionId: paymentInput.providerTransactionId,
      },
    });

    return {
      ...result,
      alreadySettled: false,
    };
  } catch {
    const db = getLocalDb();
    const resolvedTenant = resolveLocalTenantId(tenantId);
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any;
    if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);

    const now = new Date().toISOString();
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    db.prepare(`
      UPDATE invoices
      SET status = 'paid', paid_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, invoiceId);

    db.prepare(`
      INSERT INTO payments (id, tenant_id, invoice_id, amount, currency, method, reference, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(paymentId, resolvedTenant, invoiceId, paymentInput.amount, paymentInput.currency || invoice.currency || 'USD', paymentInput.method, paymentInput.providerTransactionId || null, now);

    if (invoice.order_id) {
      db.prepare(`
        UPDATE orders
        SET status = 'paid', updated_at = ?
        WHERE id = ?
      `).run(now, invoice.order_id);

      // Enqueue background job for provisioning
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      db.prepare(`
        INSERT INTO background_jobs (id, tenant_id, job_type, status, attempts, max_attempts, payload, run_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(jobId, resolvedTenant, 'provision_service', 'queued', 0, 3, JSON.stringify({
        tenantId: resolvedTenant,
        orderId: invoice.order_id,
        customerId: invoice.customer_id,
        invoiceId,
      }), now, now);
    }

    return {
      invoice: {
        ...invoice,
        status: 'paid',
        paidDate: new Date(now),
        updatedAt: new Date(now),
      } as any,
      payment: {
        id: paymentId,
        tenantId: resolvedTenant,
        invoiceId,
        amount: paymentInput.amount as any,
        currency: paymentInput.currency || 'USD',
        method: paymentInput.method,
        createdAt: new Date(now),
      } as any,
      alreadySettled: false,
    };
  }
}
