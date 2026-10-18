import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireResellerStaff, AuthenticationError } from '@/lib/auth/guards';
import { getInvoiceById, settleInvoice } from '@/lib/services/invoice.service';
import { recordAuditEvent } from '@/lib/services/audit.service';

const manualPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  method: z.literal('manual_offline').default('manual_offline'),
  providerTransactionId: z.string().trim().min(3).max(255),
  idempotencyKey: z.string().trim().min(8).max(255),
  confirmationNote: z.string().trim().min(10).max(1000),
});

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  let user;
  try {
    const auth = await requireResellerStaff(tenantId, ['owner', 'admin', 'billing'], req);
    user = auth.user;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'A manual payment confirmation payload is required.' }, { status: 400 });
  }

  const parsed = manualPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: parsed.error.format(),
      requirements: ['method=manual_offline', 'providerTransactionId', 'idempotencyKey', 'confirmationNote'],
    }, { status: 400 });
  }

  const invoice = await getInvoiceById(tenantId, id);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const authoritativeAmount = Number(invoice.total);
  if (
    parsed.data.amount !== undefined &&
    Math.abs(parsed.data.amount - authoritativeAmount) > 0.009
  ) {
    return NextResponse.json({
      error: 'Manual confirmation amount must match the server-calculated invoice balance.',
      expectedAmount: authoritativeAmount,
      currency: invoice.currency,
    }, { status: 400 });
  }

  try {
    const result = await settleInvoice(
      tenantId,
      id,
      {
        amount: authoritativeAmount,
        currency: invoice.currency,
        method: 'manual_offline',
        providerTransactionId: parsed.data.providerTransactionId,
        idempotencyKey: parsed.data.idempotencyKey,
        metadata: {
          manualConfirmation: true,
          confirmationNote: parsed.data.confirmationNote,
          confirmedByUserId: user.id,
        },
      },
      user.id
    );

    if (!result.alreadySettled) {
      await recordAuditEvent(tenantId, {
        actorId: user.id,
        action: 'invoice.manual_offline_payment_confirmed',
        resourceType: 'invoice',
        resourceId: id,
        payload: {
          amount: authoritativeAmount,
          currency: invoice.currency,
          providerTransactionId: parsed.data.providerTransactionId,
          confirmationNote: parsed.data.confirmationNote,
          idempotencyKey: parsed.data.idempotencyKey,
        },
      });
    }

    const refreshed = await getInvoiceById(tenantId, id);
    return NextResponse.json({
      success: true,
      invoice: refreshed,
      payment: result.payment,
      alreadySettled: result.alreadySettled,
      message: 'Manual offline payment evidence was recorded. If this invoice has an order, provisioning is queued for the worker and was not executed inside this request.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Manual payment confirmation failed.' },
      { status: 409 }
    );
  }
}
