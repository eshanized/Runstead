import { prisma } from '../db/client.ts';
import { getLocalDb, resolveLocalTenantId } from '../db/local-db.ts';
import { getHostingProvider } from '../providers/hosting/factory.ts';
import { sendTransactionalNotification } from '../services/notification.service.ts';
import { recordAuditEvent } from '../services/audit.service.ts';
import { redactSensitiveData } from '../security/redact.ts';
import type { BackgroundJob } from '@prisma/client';
import type { JobType, JobExecutionResult, ProvisionServicePayload } from './types.ts';

export interface EnqueueJobOptions {
  runAt?: Date;
  maxAttempts?: number;
}

/**
 * Durably enqueues an asynchronous operational job.
 */
export async function enqueueJob(
  tenantId: string,
  jobType: JobType,
  payload: Record<string, any>,
  options: EnqueueJobOptions = {}
): Promise<BackgroundJob> {
  const sanitizedPayload = redactSensitiveData(payload);

  try {
    return await prisma.backgroundJob.create({
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
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Failed to enqueue background job: ${err instanceof Error ? err.message : String(err)}`);
    }

    const db = getLocalDb();
    const resolvedTenant = resolveLocalTenantId(tenantId);
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO background_jobs (id, tenant_id, job_type, status, attempts, max_attempts, payload, run_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      resolvedTenant,
      jobType,
      'queued',
      0,
      options.maxAttempts || 3,
      JSON.stringify(sanitizedPayload),
      options.runAt ? options.runAt.toISOString() : now,
      now
    );

    return {
      id,
      tenantId: resolvedTenant,
      jobType,
      status: 'queued',
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      payload: sanitizedPayload,
      runAt: options.runAt || new Date(now),
      completedAt: null,
      errorDetails: null,
      createdAt: new Date(now),
    } as any;
  }
}

/**
 * Worker runner: processes queued background operational jobs.
 * Supports atomic SKIP LOCKED concurrency, exponential retry backoff, provider reconciliation, and failure logging.
 */
export async function processPendingJobs(options: { limit?: number } = {}) {
  const limit = Math.min(50, Math.max(1, options.limit || 10));
  const now = new Date();

  // 1. Fetch and atomically claim eligible jobs using PostgreSQL FOR UPDATE SKIP LOCKED
  let jobs: BackgroundJob[] = [];
  let isPrisma = true;

  try {
    const rawJobs = await prisma.$queryRaw<Array<{
      id: string;
      tenant_id: string;
      job_type: string;
      status: string;
      attempts: number;
      max_attempts: number;
      payload: any;
      run_at: Date;
      completed_at: Date | null;
      error_details: string | null;
      created_at: Date;
      updated_at: Date;
    }>>`
      WITH claimable AS (
        SELECT id
        FROM "background_jobs"
        WHERE status = 'queued' AND run_at <= ${now}
        ORDER BY run_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE "background_jobs" b
      SET status = 'processing',
          attempts = b.attempts + 1,
          updated_at = NOW()
      FROM claimable
      WHERE b.id = claimable.id
      RETURNING b.id, b.tenant_id, b.job_type, b.status, b.attempts, b.max_attempts, b.payload, b.run_at, b.completed_at, b.error_details, b.created_at, b.updated_at
    `;

    jobs = rawJobs.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      jobType: r.job_type,
      status: r.status,
      attempts: r.attempts,
      maxAttempts: r.max_attempts,
      payload: r.payload,
      runAt: r.run_at,
      completedAt: r.completed_at,
      errorDetails: r.error_details,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Failed to claim background jobs: ${err instanceof Error ? err.message : String(err)}`);
    }

    isPrisma = false;
    const db = getLocalDb();
    const rows = db.prepare(`
      SELECT * FROM background_jobs
      WHERE status = 'queued'
      ORDER BY run_at ASC
      LIMIT ?
    `).all(limit) as any[];

    jobs = rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      jobType: r.job_type,
      status: r.status,
      attempts: r.attempts,
      maxAttempts: r.max_attempts,
      payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
      runAt: new Date(r.run_at),
      completedAt: r.completed_at ? new Date(r.completed_at) : null,
      errorDetails: r.error_details,
      createdAt: new Date(r.created_at),
    })) as any[];
  }

  const results: JobExecutionResult[] = [];

  for (const job of jobs) {
    if (!isPrisma) {
      const db = getLocalDb();
      db.prepare("UPDATE background_jobs SET status = 'processing', attempts = attempts + 1 WHERE id = ?").run(job.id);
    }

    const currentAttempt = job.attempts;
    let jobSuccess = false;
    let jobError: string | undefined;
    let jobResultPayload: any;

    try {
      jobResultPayload = await executeJobHandler(job);
      jobSuccess = true;
    } catch (err: unknown) {
      jobError = err instanceof Error ? err.message : String(err);
    }

    if (jobSuccess) {
      if (isPrisma) {
        await prisma.backgroundJob.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            errorDetails: null,
          },
        });
      } else {
        const db = getLocalDb();
        db.prepare("UPDATE background_jobs SET status = 'completed', completed_at = CURRENT_TIMESTAMP, error_details = NULL WHERE id = ?").run(job.id);
      }

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
      const backoffMs = Math.pow(currentAttempt, 2) * 30_000;
      const nextRunAt = new Date(Date.now() + backoffMs);

      if (isPrisma) {
        await prisma.backgroundJob.update({
          where: { id: job.id },
          data: {
            status: nextStatus,
            errorDetails: jobError,
            runAt: nextRunAt,
          },
        });
      } else {
        const db = getLocalDb();
        db.prepare('UPDATE background_jobs SET status = ?, error_details = ?, run_at = ? WHERE id = ?').run(
          nextStatus,
          jobError || 'Unknown error',
          nextRunAt.toISOString(),
          job.id
        );
      }

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
      let customerName = 'Customer';
      let customerEmail = 'customer@example.com';
      let productName = 'Cloud Hosting';

      try {
        if (p.orderId) {
          order = await prisma.order.findUnique({
            where: { tenantId_id: { tenantId: job.tenantId, id: p.orderId } },
            include: { customer: true, product: true },
          });
          if (order) {
            customerName = order.customer.name;
            customerEmail = order.customer.email;
            productName = order.product.name;
          }
        } else if (p.customerId) {
          const cust = await prisma.customer.findUnique({
            where: { tenantId_id: { tenantId: job.tenantId, id: p.customerId } },
          });
          if (cust) {
            customerName = cust.name;
            customerEmail = cust.email;
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') {
          throw err;
        }
        const db = getLocalDb();
        if (p.orderId) {
          order = db.prepare('SELECT * FROM orders WHERE id = ?').get(p.orderId) as any;
          if (order) {
            const cust = db.prepare('SELECT name, email FROM customers WHERE id = ?').get(order.customer_id) as any;
            if (cust) {
              customerName = cust.name;
              customerEmail = cust.email;
            }
            productName = order.product_name || 'Cloud Hosting';
          }
        }
      }

      const domain =
        p.domain ||
        `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}.runstead.site`;
      const username = p.username || `u${Date.now().toString().slice(-6)}`;
      const packageName = p.package || productName;

      // Call hosting provider account creation
      const result = await provider.createAccount({
        domain,
        username,
        plan: packageName,
        contactEmail: customerEmail,
      });

      if (!result.success) {
        throw new Error(result.message || 'Hosting provider failed to provision account');
      }

      // Record provisioned service in PostgreSQL
      let serviceId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      try {
        const targetCustomerId = order?.customerId || p.customerId;
        if (targetCustomerId) {
          let targetProductId = order?.productId || p.productId;
          if (!targetProductId) {
            const defaultProd = await prisma.product.findFirst({ where: { tenantId: job.tenantId } });
            if (defaultProd) targetProductId = defaultProd.id;
          }

          if (targetProductId) {
            const service = await prisma.service.create({
              data: {
                tenantId: job.tenantId,
                customerId: targetCustomerId,
                productId: targetProductId,
                orderId: order?.id || undefined,
                serviceName: `${productName} (${domain})`,
                package: packageName,
                domain,
                billingCycle: order?.billingCycle || 'monthly',
                price: order?.amount || 9.99,
                ipAddress: result.ipAddress,
                serverHostname: 'srv1.runstead.infrastructure',
                username: result.username,
                status: 'active',
                nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
            serviceId = service.id;
          }

          if (order) {
            await prisma.order.update({
              where: { tenantId_id: { tenantId: job.tenantId, id: order.id } },
              data: { status: 'active' },
            });
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') {
          throw err;
        }
        const db = getLocalDb();
        const resolvedTenant = resolveLocalTenantId(job.tenantId);
        const now = new Date().toISOString();

        if (order) {
          db.prepare(`
            INSERT INTO services (id, tenant_id, customer_id, product_id, order_id, service_name, package, domain, billing_cycle, price, ip_address, server_hostname, username, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            serviceId,
            resolvedTenant,
            order.customerId || order.customer_id,
            order.productId || order.product_id,
            order.id,
            `${productName} (${domain})`,
            packageName,
            domain,
            order.billingCycle || order.billing_cycle || 'monthly',
            order.amount || 9.99,
            result.ipAddress || '198.51.100.50',
            'srv1.runstead.infrastructure',
            result.username,
            'active',
            now,
            now
          );

          db.prepare("UPDATE orders SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order.id);
        }
      }

      // Send transactional notification
      await sendTransactionalNotification({
        to: customerEmail,
        subject: `Your Hosting Service "${domain}" is Active`,
        template: 'service_provisioned',
        data: {
          domain,
          username: result.username,
          ipAddress: result.ipAddress,
          nameservers: result.nameservers,
        },
      });

      return { serviceId, username: result.username, domain };
    }

    case 'suspend_service': {
      const username = payload.username as string;
      const res = await provider.suspendAccount(username, payload.reason);
      if (!res.success) throw new Error(res.message);

      if (payload.serviceId) {
        try {
          await prisma.service.update({
            where: { tenantId_id: { tenantId: job.tenantId, id: payload.serviceId } },
            data: { status: 'suspended' },
          });
        } catch (err) {
          if (process.env.NODE_ENV === 'production') {
            throw err;
          }
          const db = getLocalDb();
          db.prepare("UPDATE services SET status = 'suspended', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(payload.serviceId);
        }
      }
      return res;
    }

    case 'unsuspend_service': {
      const username = payload.username as string;
      const res = await provider.unsuspendAccount(username);
      if (!res.success) throw new Error(res.message);

      if (payload.serviceId) {
        try {
          await prisma.service.update({
            where: { tenantId_id: { tenantId: job.tenantId, id: payload.serviceId } },
            data: { status: 'active' },
          });
        } catch (err) {
          if (process.env.NODE_ENV === 'production') {
            throw err;
          }
          const db = getLocalDb();
          db.prepare("UPDATE services SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(payload.serviceId);
        }
      }
      return res;
    }

    case 'terminate_service': {
      const username = payload.username as string;
      const res = await provider.terminateAccount(username);
      if (!res.success) throw new Error(res.message);

      if (payload.serviceId) {
        try {
          await prisma.service.update({
            where: { tenantId_id: { tenantId: job.tenantId, id: payload.serviceId } },
            data: { status: 'canceled' },
          });
        } catch (err) {
          if (process.env.NODE_ENV === 'production') {
            throw err;
          }
          const db = getLocalDb();
          db.prepare("UPDATE services SET status = 'canceled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(payload.serviceId);
        }
      }
      return res;
    }

    default:
      throw new Error(`Unsupported job type: ${job.jobType}`);
  }
}
