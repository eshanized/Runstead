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

export async function getInvoiceById(tenantId: string, invoiceId: string) {
  const inv = await withTenantContext(tenantId, (tx) => tx.invoice.findUnique({
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
  ]);

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
 * Settles an invoice with full transactional consistency, financial validation,
 * and idempotency protection against duplicate or concurrent charges.
 * Automatically marks the linked order paid and enqueues service provisioning.
 */
export async function settleInvoice(
  tenantId: string,
  invoiceId: string,
  paymentInput: SettleInvoicePaymentInput,
  actorId?: string
): Promise<{ invoice: Invoice & { total?: number }; payment: Payment; alreadySettled: boolean }> {
  // Idempotency is checked before and again under the invoice row lock.
  // Reusing an event key for another invoice or different payment data is an error.
  if (paymentInput.idempotencyKey) {
    const existingPayment = await withTenantContext(tenantId, (tx) => tx.payment.findFirst({
      where: {
        tenantId,
        idempotencyKey: paymentInput.idempotencyKey,
      },
      include: { invoice: true },
    });

    if (existingPayment) {
      const amountMatches = Math.abs(Number(existingPayment.amount) - Number(paymentInput.amount)) <= 0.009;
      const currencyMatches = existingPayment.currency.toUpperCase() ===
        (paymentInput.currency || existingPayment.currency).trim().toUpperCase();
      const transactionMatches = !paymentInput.providerTransactionId ||
        !existingPayment.providerTransactionId ||
        existingPayment.providerTransactionId === paymentInput.providerTransactionId;

      if (
        existingPayment.invoiceId !== invoiceId ||
        !amountMatches ||
        !currencyMatches ||
        !transactionMatches
      ) {
        throw new Error('Idempotency key was already used for a different invoice or payment payload.');
      }

      return {
        invoice: Object.assign(existingPayment.invoice, { total: Number(existingPayment.invoice.totalAmount) }),
        payment: existingPayment,
        alreadySettled: true,
      };
    }
  }

  // 2. Fetch target invoice in authorized tenant
  const invoice = await withTenantContext(tenantId, (tx) => tx.invoice.findUnique({
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
    const payment = await withTenantContext(tenantId, (tx) => tx.payment.findFirst({
      where: { tenantId, invoiceId },
      orderBy: { createdAt: 'desc' },
    }));
    return {
      invoice: Object.assign(invoice, { total: Number(invoice.totalAmount) }),
      payment: payment!,
      alreadySettled: true,
    };
  }

  // 3. Strict financial settlement validation
  const authoritativeTotal = Number(invoice.totalAmount);
  const incomingAmount = Number(paymentInput.amount);
  if (Math.abs(authoritativeTotal - incomingAmount) > 0.009) {
    throw new Error(
      `Payment amount mismatch: Expected ${authoritativeTotal} ${invoice.currency}, but received ${incomingAmount}`
    );
  }

  const normalizedCurrency = (paymentInput.currency || invoice.currency).trim().toUpperCase();
  if (normalizedCurrency !== invoice.currency.toUpperCase()) {
    throw new Error(
      `Payment currency mismatch: Expected ${invoice.currency.toUpperCase()}, but received ${normalizedCurrency}`
    );
  }

  if (!Number.isFinite(incomingAmount) || incomingAmount <= 0) {
    throw new Error('Payment amount must be a finite positive number.');
  }
  if (paymentInput.method.toLowerCase() === 'stripe' && !paymentInput.providerTransactionId) {
    throw new Error('A verified Stripe transaction identifier is required for settlement.');
  }

  // 4. Serialize settlement for this invoice using a row lock. The unique idempotency
  // constraint on payments is the second line of defense for duplicate provider events.
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
    if (!current) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    // Re-check idempotency after taking the invoice lock to handle concurrent deliveries.
    if (paymentInput.idempotencyKey) {
      const existingPay = await tx.payment.findFirst({
        where: { tenantId, idempotencyKey: paymentInput.idempotencyKey },
        include: { invoice: true },
      });
      if (existingPay) {
        const amountMatches = Math.abs(Number(existingPay.amount) - incomingAmount) <= 0.009;
        const currencyMatches = existingPay.currency.toUpperCase() === normalizedCurrency;
        const transactionMatches = !paymentInput.providerTransactionId ||
          !existingPay.providerTransactionId ||
          existingPay.providerTransactionId === paymentInput.providerTransactionId;
        if (
          existingPay.invoiceId !== invoiceId ||
          !amountMatches ||
          !currencyMatches ||
          !transactionMatches
        ) {
          throw new Error('Idempotency key was already used for a different invoice or payment payload.');
        }
        return {
          invoice: existingPay.invoice,
          payment: existingPay,
          alreadySettled: true,
        };
      }
    }

    // Revalidate against the row protected by the lock, not only the earlier read.
    const lockedTotal = Number(current.totalAmount);
    if (!Number.isFinite(lockedTotal) || Math.abs(lockedTotal - incomingAmount) > 0.009) {
      throw new Error(
        `Payment amount mismatch: Expected ${lockedTotal} ${current.currency}, but received ${incomingAmount}`
      );
    }
    if (normalizedCurrency !== current.currency.toUpperCase()) {
      throw new Error(
        `Payment currency mismatch: Expected ${current.currency.toUpperCase()}, but received ${normalizedCurrency}`
      );
    }

    if (current.status === 'paid') {
      const existingPay = await tx.payment.findFirst({
        where: { tenantId, invoiceId },
        orderBy: { createdAt: 'desc' },
      });
      if (!existingPay) {
        throw new Error('Invoice is marked paid but has no corresponding payment record; manual reconciliation is required.');
      }
      return {
        invoice: current,
        payment: existingPay,
        alreadySettled: true,
      };
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
        method: paymentInput.method,
        providerTransactionId: paymentInput.providerTransactionId,
        idempotencyKey: paymentInput.idempotencyKey,
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

    return {
      invoice: updatedInvoice,
      payment: createdPayment,
      alreadySettled: false,
    };
  });

  if (result.alreadySettled) {
    return {
      invoice: Object.assign(result.invoice, { total: Number(result.invoice.totalAmount) }),
      payment: result.payment,
      alreadySettled: true,
    };
  }

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'invoice.settled',
    resourceType: 'invoice',
    resourceId: invoice.id,
    payload: {
      amount: incomingAmount,
      currency: invoice.currency,
      method: paymentInput.method,
      providerTransactionId: paymentInput.providerTransactionId,
    },
  });

  return {
    invoice: Object.assign(result.invoice, { total: Number(result.invoice.totalAmount) }),
    payment: result.payment,
    alreadySettled: false,
  };
}
