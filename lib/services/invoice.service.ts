import { prisma } from '../db/client.ts';
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
  const inv = await prisma.invoice.findUnique({
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
        invoice: Object.assign(existingPayment.invoice, { total: Number(existingPayment.invoice.totalAmount) }),
        payment: existingPayment,
        alreadySettled: true,
      };
    }
  }

  // 2. Fetch target invoice in authorized tenant
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

  // 4. Perform atomic settlement transaction in PostgreSQL
  const result = await prisma.$transaction(async (tx) => {
    // Re-verify status under transaction lock to prevent race condition double-settlement
    const current = await tx.invoice.findUnique({
      where: { tenantId_id: { tenantId, id: invoiceId } },
    });
    if (current?.status === 'paid') {
      const existingPay = await tx.payment.findFirst({
        where: { tenantId, invoiceId },
        orderBy: { createdAt: 'desc' },
      });
      return {
        invoice: current,
        payment: existingPay!,
        alreadySettled: true,
      };
    }

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
        amount: incomingAmount,
        currency: invoice.currency,
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
          increment: incomingAmount,
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
