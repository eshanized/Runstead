import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../lib/db/client.ts';
import { enqueueJob, processPendingJobs } from '../lib/jobs/queue.ts';
import { createCustomer } from '../lib/services/customer.service.ts';

describe('Job Concurrency & Atomic PostgreSQL Claiming Suite', () => {
  const tenantId = 'e0000000-0000-0000-0000-000000000001';

  test('Atomic SKIP LOCKED: concurrent workers never claim or execute the same job twice', async () => {
    // 1. Create a customer to associate provisioning jobs with
    const cust = await createCustomer(tenantId, {
      name: 'Concurrent Queue Customer',
      email: `concurrent_${Date.now()}@test.org`,
    });

    // 2. Enqueue 6 distinct provisioning jobs
    const jobIds: string[] = [];
    const totalJobs = 6;

    for (let i = 0; i < totalJobs; i++) {
      const job = await enqueueJob(tenantId, 'provision_service', {
        tenantId,
        customerId: cust.id,
        domain: `concur-${Date.now().toString().slice(-4)}-${i}.org`,
        package: 'Starter Cloud Hosting',
        username: `cuser${Date.now().toString().slice(-4)}${i}`,
      });
      jobIds.push(job.id);
    }

    assert.equal(jobIds.length, totalJobs);

    // 3. Launch 3 concurrent worker processes simultaneously
    const workerPromises = [
      processPendingJobs({ limit: 4 }),
      processPendingJobs({ limit: 4 }),
      processPendingJobs({ limit: 4 }),
    ];

    const workerResults = await Promise.all(workerPromises);

    // 4. Collect all executed job IDs across all workers
    const allProcessedJobIds: string[] = [];
    let totalProcessedCount = 0;

    for (const w of workerResults) {
      totalProcessedCount += w.processed;
      for (const res of w.results) {
        allProcessedJobIds.push(res.jobId);
      }
    }

    // 5. Verify no job was processed more than once across workers (mutual exclusivity)
    const uniqueJobIds = new Set(allProcessedJobIds);
    assert.equal(
      allProcessedJobIds.length,
      uniqueJobIds.size,
      'Every claimed job must be mutually exclusive; no concurrent worker double-claim'
    );

    // 6. Verify database records for all jobs
    const dbJobs = await prisma.backgroundJob.findMany({
      where: { id: { in: jobIds } },
    });

    assert.equal(dbJobs.length, totalJobs);

    for (const job of dbJobs) {
      assert.equal(job.status, 'completed', `Job ${job.id} must be completed`);
      assert.equal(job.attempts, 1, `Job ${job.id} must have exactly 1 attempt count`);
    }
  });
});
