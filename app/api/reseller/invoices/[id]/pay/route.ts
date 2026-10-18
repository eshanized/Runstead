import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireResellerStaff, AuthorizationError, AuthenticationError } from '@/lib/auth/guards';
import { getInvoiceById, settleInvoice } from '@/lib/services/invoice.service';
import { processPendingJobs } from '@/lib/jobs/queue';

const payInvoiceSchema = z.object({
  amount: z.number().positive().optional(),
  method: z.string().default('manual_credit_card'),
  providerTransactionId: z.string().optional(),
  idempotencyKey: z.string().optional(),
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

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is allowed, defaults will be used
  }

  const parsed = payInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const invoice = await getInvoiceById(tenantId, id);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const amount = parsed.data.amount || Number(invoice.total);

  try {
    const result = await settleInvoice(
      tenantId,
      id,
      {
        amount,
        method: parsed.data.method,
        providerTransactionId: parsed.data.providerTransactionId || `tx_${Date.now()}`,
        idempotencyKey: parsed.data.idempotencyKey,
      },
      user.id
    );

    // Run queued provisioning jobs automatically
    await processPendingJobs({ limit: 10 });

    const refreshed = await getInvoiceById(tenantId, id);

    return NextResponse.json({
      success: true,
      invoice: refreshed,
      payment: result.payment,
      alreadySettled: result.alreadySettled,
      message: 'Invoice successfully settled and payment recorded.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to settle invoice' },
      { status: 400 }
    );
  }
}
