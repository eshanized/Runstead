import { prisma } from '../db/client.ts';
import { getHostingProvider } from '../providers/hosting/factory.ts';
import { sendTransactionalNotification } from '../services/notification.service.ts';
import { recordAuditEvent } from '../services/audit.service.ts';
import { redactSensitiveData } from '../security/redact.ts';
import type { BackgroundJob } from '@prisma/client';
import type { JobType, JobExecutionResult, ProvisionServicePayload } from './types';

export interface EnqueueJobOptions {
  runAt?: Date;
  maxAttempts?: number;
}

/**
 * Durably enqueues an asynchronous operational job in PostgreSQL.
 */
export async function enqueueJob(
  tenantId: string,
  jobType: JobType,
  payload: Record<string, any>,
  options: EnqueueJobOptions = {}
): Promise<BackgroundJob> {
  const sanitizedPayload = redactSensitiveData(payload);

  const job = await prisma.backgroundJob.create({
    data: {
      tenantId,
      jobType,
      status: 'queued',
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      payload: sanitizedPayload,
      runAt: options.runAt || new Date(),
    },
  });

  return job;
}

/**
 * Worker runner: processes queued background operational jobs.
 * Supports exponential retry backoff, provider reconciliation, and failure logging.
 */
export async function processPendingJobs(options: { limit?: number } = {}) {
  const limit = Math.min(50, Math.max(1, options.limit || 10));
  const now = new Date();

  // 1. Fetch eligible jobs
  let jobs: BackgroundJob[] = [];
  try {
    jobs = await prisma.backgroundJob.findMany({
      where: {
        status: 'queued',
        runAt: { lte: now },
      },
      orderBy: { runAt: 'asc' },
      take: limit,
    });
  } catch {
    return { processed: 0, succeeded: 0, failed: 0, results: [] };
  }

  const results: JobExecutionResult[] = [];

  for (const job of jobs) {
    // 2. Optimistic lock: mark job as processing
    try {
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: 'processing',
          attempts: { increment: 1 },
        },
      });
    } catch {
      continue; // Skip if another worker picked it up
    }

    const currentAttempt = job.attempts + 1;
    let jobSuccess = false;
    let jobError: string | undefined;
    let jobResultPayload: any;

    try {
      // 3. Execute job handler based on jobType
      jobResultPayload = await executeJobHandler(job);
      jobSuccess = true;
    } catch (err: unknown) {
      jobError = err instanceof Error ? err.message : String(err);
    }

    // 4. Update durable job state
    if (jobSuccess) {
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          errorDetails: null,
        },
      });

      results.push({
        jobId: job.id,
        jobType: job.jobType as JobType,
        status: 'completed',
        attempts: currentAttempt,
        result: jobResultPayload,
      });
    } else {
      const isExhausted = currentAttempt >= job.maxAttempts;
      const nextStatus = isExhausted ? 'failed' : 'queued';

      // Exponential backoff: attempt 1 -> +30s, attempt 2 -> +120s, attempt 3 -> +270s
      const backoffMs = Math.pow(currentAttempt, 2) * 30_000;
      const nextRunAt = new Date(Date.now() + backoffMs);

      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: nextStatus,
          errorDetails: jobError,
          runAt: nextRunAt,
        },
      });

      if (isExhausted) {
        await recordAuditEvent(job.tenantId, {
          actorType: 'system',
          action: `job.exhausted_${job.jobType}`,
          resourceType: 'background_job',
          resourceId: job.id,
          payload: { error: jobError, attempts: currentAttempt },
        });
      }

      results.push({
        jobId: job.id,
        jobType: job.jobType as JobType,
        status: nextStatus,
        attempts: currentAttempt,
        error: jobError,
      });
    }
  }

  return {
    processed: jobs.length,
    succeeded: results.filter((r) => r.status === 'completed').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  };
}

/**
 * Routes and executes the specific operational workflow for a background job.
 */
async function executeJobHandler(job: BackgroundJob): Promise<any> {
  const payload = (job.payload || {}) as Record<string, any>;
  const provider = await getHostingProvider(job.tenantId);

  switch (job.jobType) {
    case 'provision_service': {
      const p = payload as ProvisionServicePayload;
      let order: any = null;
      if (p.orderId) {
        order = await prisma.order.findUnique({
          where: { tenantId_id: { tenantId: job.tenantId, id: p.orderId } },
          include: { customer: true, product: true },
        });
      }

      const domain = p.domain || (order ? `${order.customer.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}.runstead.site` : `site-${Date.now()}.runstead.site`);
      const username = p.username || `u${Date.now().toString().slice(-6)}`;
      const packageName = p.package || (order ? order.product.name : 'Standard');
      const contactEmail = order ? order.customer.email : 'customer@example.com';

      // Call hosting provider account creation
      const result = await provider.createAccount({
        domain,
        username,
        plan: packageName,
        contactEmail,
      });

      if (!result.success) {
        throw new Error(result.message || 'Hosting provider failed to provision account');
      }

      // Record provisioned service in PostgreSQL
      let service = null;
      if (order) {
        service = await prisma.service.create({
          data: {
            tenantId: job.tenantId,
            customerId: order.customerId,
            productId: order.productId,
            orderId: order.id,
            serviceName: `${order.product.name} (${domain})`,
            package: packageName,
            domain,
            billingCycle: order.billingCycle,
            price: order.amount,
            ipAddress: result.ipAddress,
            serverHostname: 'srv1.runstead.infrastructure',
            username: result.username,
            status: 'active',
            nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        await prisma.order.update({
          where: { tenantId_id: { tenantId: job.tenantId, id: order.id } },
          data: { status: 'active' },
        });
      }

      // Send transactional notification
      await sendTransactionalNotification({
        to: contactEmail,
        subject: `Your Hosting Service "${domain}" is Active`,
        template: 'service_provisioned',
        data: {
          domain,
          username: result.username,
          ipAddress: result.ipAddress,
          nameservers: result.nameservers,
        },
      });

      return { serviceId: service?.id, username: result.username, domain };
    }

    case 'suspend_service': {
      const username = payload.username as string;
      const res = await provider.suspendAccount(username, payload.reason);
      if (!res.success) throw new Error(res.message);

      if (payload.serviceId) {
        await prisma.service.update({
          where: { tenantId_id: { tenantId: job.tenantId, id: payload.serviceId } },
          data: { status: 'suspended' },
        });
      }
      return res;
    }

    case 'unsuspend_service': {
      const username = payload.username as string;
      const res = await provider.unsuspendAccount(username);
      if (!res.success) throw new Error(res.message);

      if (payload.serviceId) {
        await prisma.service.update({
          where: { tenantId_id: { tenantId: job.tenantId, id: payload.serviceId } },
          data: { status: 'active' },
        });
      }
      return res;
    }

    case 'terminate_service': {
      const username = payload.username as string;
      const res = await provider.terminateAccount(username);
      if (!res.success) throw new Error(res.message);

      if (payload.serviceId) {
        await prisma.service.update({
          where: { tenantId_id: { tenantId: job.tenantId, id: payload.serviceId } },
          data: { status: 'canceled' },
        });
      }
      return res;
    }

    case 'create_backup': {
      const username = payload.username as string;
      const res = await provider.createBackup(username);
      if (!res.success) throw new Error(res.message);
      return res;
    }

    case 'send_notification': {
      const res = await sendTransactionalNotification(payload as any);
      if (!res.accepted) throw new Error(res.error || 'Failed to deliver notification');
      return res;
    }

    default:
      throw new Error(`Unsupported jobType: ${job.jobType}`);
  }
}
