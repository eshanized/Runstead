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
  return prisma.invoice.findUnique({
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
    invoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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
  // 1. Idempotency Check: prevent duplicate charges or duplicate side effects
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

    // A. Update invoice
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

    // B. Create payment record
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

    // C. Update Customer total revenue
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

    // D. If order attached, transition order status and enqueue provisioning job
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

      // Enqueue background provisioning job
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
}
