import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireResellerStaff, AuthorizationError, AuthenticationError } from '@/lib/auth/guards';
import { getServiceById, updateServiceStatus } from '@/lib/services/service.service';
import { enqueueJob, processPendingJobs } from '@/lib/jobs/queue';

const serviceActionSchema = z.object({
  action: z.enum(['suspend', 'unsuspend', 'restore', 'terminate']),
  reason: z.string().optional(),
});

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

  let user;
  try {
    const auth = await requireResellerStaff(tenantId, ['owner', 'admin', 'support'], req);
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

  const parsed = serviceActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid action (suspend, unsuspend, restore, terminate) required' }, { status: 400 });
  }

  const service = await getServiceById(tenantId, id);
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const { action, reason } = parsed.data;

  try {
    if (action === 'suspend') {
      const job = await enqueueJob(tenantId, 'suspend_service', {
        serviceId: id,
        username: service.username || 'client',
        reason,
      });
      const runner = await processPendingJobs({ limit: 10 });
      const jobResult = runner.results.find((r) => r.jobId === job.id);
      if (jobResult && jobResult.status === 'failed') {
        return NextResponse.json(
          { error: `Provider suspension failed: ${jobResult.error || 'Hosting provider error'}` },
          { status: 502 }
        );
      }
      const updated = await getServiceById(tenantId, id);
      return NextResponse.json({ success: true, service: updated, message: 'Service suspended successfully.' });
    }

    if (action === 'unsuspend' || action === 'restore') {
      const job = await enqueueJob(tenantId, 'unsuspend_service', {
        serviceId: id,
        username: service.username || 'client',
      });
      const runner = await processPendingJobs({ limit: 10 });
      const jobResult = runner.results.find((r) => r.jobId === job.id);
      if (jobResult && jobResult.status === 'failed') {
        return NextResponse.json(
          { error: `Provider restore failed: ${jobResult.error || 'Hosting provider error'}` },
          { status: 502 }
        );
      }
      const updated = await getServiceById(tenantId, id);
      return NextResponse.json({ success: true, service: updated, message: 'Service restored to active status.' });
    }

    if (action === 'terminate') {
      const job = await enqueueJob(tenantId, 'terminate_service', {
        serviceId: id,
        username: service.username || 'client',
        reason,
      });
      const runner = await processPendingJobs({ limit: 10 });
      const jobResult = runner.results.find((r) => r.jobId === job.id);
      if (jobResult && jobResult.status === 'failed') {
        return NextResponse.json(
          { error: `Provider termination failed: ${jobResult.error || 'Hosting provider error'}` },
          { status: 502 }
        );
      }
      const updated = await getServiceById(tenantId, id);
      return NextResponse.json({ success: true, service: updated, message: 'Service terminated.' });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Service action failed' },
      { status: 500 }
    );
  }
}
