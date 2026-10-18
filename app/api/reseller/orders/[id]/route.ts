import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireResellerStaff, AuthorizationError, AuthenticationError } from '@/lib/auth/guards';
import { getOrderById, transitionOrderStatus } from '@/lib/services/order.service';
import { enqueueJob, processPendingJobs } from '@/lib/jobs/queue';

const orderActionSchema = z.object({
  action: z.enum(['retry', 'provision', 'cancel', 'activate']),
});

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

  try {
    await requireResellerStaff(tenantId, ['owner', 'admin', 'billing', 'support'], req);
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  const order = await getOrderById(tenantId, id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

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
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const parsed = orderActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid action (retry, provision, cancel, activate) required' }, { status: 400 });
  }

  const order = await getOrderById(tenantId, id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const { action } = parsed.data;

  if (action === 'retry' || action === 'provision') {
    // 1. Move status to provisioning
    await transitionOrderStatus(tenantId, id, 'provisioning', user.id);

    // 2. Enqueue real background provisioning job
    const job = await enqueueJob(
      tenantId,
      'provision_service',
      {
        tenantId,
        orderId: id,
        customerId: order.customerId,
        domain: (order as any).domain || 'client-site.net',
        package: (order as any).productName || 'Starter Cloud Hosting',
      }
    );

    // 3. Process jobs
    await processPendingJobs({ limit: 10 });

    // 4. Return updated order
    const updated = await getOrderById(tenantId, id);
    const isCompleted = updated?.status === 'active';
    return NextResponse.json({
      success: true,
      order: updated,
      jobId: job.id,
      provisioned: isCompleted,
      message: isCompleted
        ? 'Service provisioning completed successfully.'
        : 'Service provisioning job enqueued and currently processing.',
    });
  }

  if (action === 'cancel') {
    const updated = await transitionOrderStatus(tenantId, id, 'canceled', user.id);
    return NextResponse.json({ success: true, order: updated, message: 'Order canceled.' });
  }

  if (action === 'activate') {
    const updated = await transitionOrderStatus(tenantId, id, 'active', user.id);
    return NextResponse.json({ success: true, order: updated, message: 'Order marked active.' });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
