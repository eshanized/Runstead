import { withTenantContext } from '../db/client.ts';
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

function assertPaymentMatches(
  existing: Payment,
  invoiceId: string,
  amount: number,
  currency: string,
  input: SettleInvoicePaymentInput
): void {
  const amountMatches = Math.abs(Number(existing.amount) - amount) <= 0.009;
  const currencyMatches = existing.currency.toUpperCase() === currency.toUpperCase();
  const methodMatches = existing.method.toLowerCase() === input.method.toLowerCase();
  const transactionMatches = (existing.providerTransactionId || null) === (input.providerTransactionId || null);

  if (
    existing.invoiceId !== invoiceId ||
    existing.status !== 'succeeded' ||
    !amountMatches ||
    !currencyMatches ||
    !methodMatches ||
    !transactionMatches
  ) {
    throw new Error('Invoice or idempotency key is already associated with a different payment. Reconciliation is required.');
  }
}

export async function getInvoiceById(tenantId: string, invoiceId: string) {
  const inv = await withTenantContext(tenantId, (tx) => tx.invoice.findUnique({
    where: { tenantId_id: { tenantId, id: invoiceId } },
    include: {
      customer: true,
      order: true,
      items: true,
      payments: true,
    },
  }));

  if (!inv) return null;
  return Object.assign(inv, {
    total: Number(inv.totalAmount),
    subtotal: Number(inv.subtotal),
    tax: Number(inv.taxAmount),
  });
}

export async function listInvoices(
  tenantId: string,
  options: { customerId?: string; status?: string; page?: number; limit?: number } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.InvoiceWhereInput = {
    tenantId,
    customerId: options.customerId,
    status: options.status,
  };

  const [invoices, total] = await withTenantContext(tenantId, async (tx) => Promise.all([
    tx.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
      },
    }),
    tx.invoice.count({ where }),
  ]));

  return {
    invoices: invoices.map((inv) =>
      Object.assign(inv, {
        total: Number(inv.totalAmount),
        subtotal: Number(inv.subtotal),
        tax: Number(inv.taxAmount),
      })
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Settles an invoice under a tenant-scoped transaction with an invoice row lock.
 * Database uniqueness on (tenantId, idempotencyKey) is the second line of defense
 * against duplicate or concurrent provider event delivery.
 */
export async function settleInvoice(
  tenantId: string,
  invoiceId: string,
  paymentInput: SettleInvoicePaymentInput,
  actorId?: string
): Promise<{ invoice: Invoice & { total?: number }; payment: Payment; alreadySettled: boolean }> {
  const incomingAmount = Number(paymentInput.amount);
  if (!Number.isFinite(incomingAmount) || incomingAmount <= 0) {
    throw new Error('Payment amount must be a finite positive number.');
  }

  const method = paymentInput.method.trim().toLowerCase();
  if (!method || method.length > 50) {
    throw new Error('A valid payment method is required.');
  }
  const transactionId = paymentInput.providerTransactionId?.trim() || undefined;
  const idempotencyKey = paymentInput.idempotencyKey?.trim() || undefined;

  if (method === 'stripe' && !transactionId) {
    throw new Error('A verified Stripe transaction identifier is required for settlement.');
  }
  if (idempotencyKey && idempotencyKey.length > 255) {
    throw new Error('Payment idempotency key is too long.');
  }
  if (transactionId && transactionId.length > 255) {
    throw new Error('Provider transaction identifier is too long.');
  }

  const invoice = await withTenantContext(tenantId, (tx) => tx.invoice.findUnique({
    where: { tenantId_id: { tenantId, id: invoiceId } },
  }));
  if (!invoice) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  const authoritativeTotal = Number(invoice.totalAmount);
  const normalizedCurrency = (paymentInput.currency || invoice.currency).trim().toUpperCase();
  if (!Number.isFinite(authoritativeTotal) || Math.abs(authoritativeTotal - incomingAmount) > 0.009) {
    throw new Error(
      `Payment amount mismatch: Expected ${authoritativeTotal} ${invoice.currency}, but received ${incomingAmount}`
    );
  }
  if (normalizedCurrency !== invoice.currency.toUpperCase()) {
    throw new Error(
      `Payment currency mismatch: Expected ${invoice.currency.toUpperCase()}, but received ${normalizedCurrency}`
    );
  }

  const normalizedInput: SettleInvoicePaymentInput = {
    ...paymentInput,
    amount: incomingAmount,
    currency: normalizedCurrency,
    method,
    providerTransactionId: transactionId,
    idempotencyKey,
  };

  if (idempotencyKey) {
    const prior = await withTenantContext(tenantId, (tx) => tx.payment.findUnique({
      where: { tenantId_idempotencyKey: { tenantId, idempotencyKey } },
    }));
    if (prior) {
      assertPaymentMatches(prior, invoiceId, incomingAmount, normalizedCurrency, normalizedInput);
      const priorInvoice = await getInvoiceById(tenantId, invoiceId);
      if (!priorInvoice) throw new Error('Payment exists but its invoice cannot be read.');
      return { invoice: priorInvoice, payment: prior, alreadySettled: true };
    }
  }

  if (invoice.status === 'paid') {
    const prior = await withTenantContext(tenantId, (tx) => tx.payment.findFirst({
      where: { tenantId, invoiceId },
      orderBy: { createdAt: 'desc' },
    }));
    if (!prior) {
      throw new Error('Invoice is marked paid but has no corresponding payment record; manual reconciliation is required.');
    }
    assertPaymentMatches(prior, invoiceId, incomingAmount, normalizedCurrency, normalizedInput);
    return {
      invoice: Object.assign(invoice, { total: Number(invoice.totalAmount) }),
      payment: prior,
      alreadySettled: true,
    };
  }

  if (!['pending', 'unpaid', 'sent', 'overdue'].includes(invoice.status.toLowerCase())) {
    throw new Error(`Invoice cannot be settled from status "${invoice.status}".`);
  }

  const result = await withTenantContext(tenantId, async (tx) => {
    const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "invoices"
      WHERE "tenant_id" = ${tenantId}::uuid
        AND "id" = ${invoiceId}::uuid
      FOR UPDATE
    `;
    if (lockedRows.length === 0) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const current = await tx.invoice.findUnique({
      where: { tenantId_id: { tenantId, id: invoiceId } },
    });
    if (!current) throw new Error(`Invoice not found: ${invoiceId}`);

    if (idempotencyKey) {
      const prior = await tx.payment.findUnique({
        where: { tenantId_idempotencyKey: { tenantId, idempotencyKey } },
      });
      if (prior) {
        assertPaymentMatches(prior, invoiceId, incomingAmount, normalizedCurrency, normalizedInput);
        return { invoice: current, payment: prior, alreadySettled: true };
      }
    }

    const lockedTotal = Number(current.totalAmount);
    if (!Number.isFinite(lockedTotal) || Math.abs(lockedTotal - incomingAmount) > 0.009) {
      throw new Error(`Payment amount mismatch: Expected ${lockedTotal} ${current.currency}, but received ${incomingAmount}`);
    }
    if (normalizedCurrency !== current.currency.toUpperCase()) {
      throw new Error(`Payment currency mismatch: Expected ${current.currency.toUpperCase()}, but received ${normalizedCurrency}`);
    }

    if (current.status === 'paid') {
      const prior = await tx.payment.findFirst({
        where: { tenantId, invoiceId },
        orderBy: { createdAt: 'desc' },
      });
      if (!prior) {
        throw new Error('Invoice is marked paid but has no corresponding payment record; manual reconciliation is required.');
      }
      assertPaymentMatches(prior, invoiceId, incomingAmount, normalizedCurrency, normalizedInput);
      return { invoice: current, payment: prior, alreadySettled: true };
    }

    if (!['pending', 'unpaid', 'sent', 'overdue'].includes(current.status.toLowerCase())) {
      throw new Error(`Invoice cannot be settled from status "${current.status}".`);
    }

    const now = new Date();
    const updatedInvoice = await tx.invoice.update({
      where: { tenantId_id: { tenantId, id: invoiceId } },
      data: { status: 'paid', paidDate: now },
    });

    const createdPayment = await tx.payment.create({
      data: {
        tenantId,
        invoiceId,
        customerId: current.customerId,
        amount: incomingAmount,
        currency: current.currency,
        method,
        providerTransactionId: transactionId,
        idempotencyKey,
        metadata: paymentInput.metadata,
        status: 'succeeded',
        settledAt: now,
      },
    });

    await tx.customer.update({
      where: { tenantId_id: { tenantId, id: current.customerId } },
      data: { totalRevenue: { increment: incomingAmount } },
    });

    if (current.orderId) {
      await tx.order.update({
        where: { tenantId_id: { tenantId, id: current.orderId } },
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
            orderId: current.orderId,
            customerId: current.customerId,
            invoiceId: current.id,
          },
        },
      });
    }

    return { invoice: updatedInvoice, payment: createdPayment, alreadySettled: false };
  });

  if (!result.alreadySettled) {
    await recordAuditEvent(tenantId, {
      actorId,
      action: 'invoice.settled',
      resourceType: 'invoice',
      resourceId: invoiceId,
      payload: {
        amount: incomingAmount,
        currency: normalizedCurrency,
        method,
        providerTransactionId: transactionId,
      },
    });
  }

  return {
    invoice: Object.assign(result.invoice, { total: Number(result.invoice.totalAmount) }),
    payment: result.payment,
    alreadySettled: result.alreadySettled,
  };
}
