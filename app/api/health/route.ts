import { NextResponse } from 'next/server';
import { checkDatabaseConnection, prisma } from '@/lib/db/client';
import { env } from '@/lib/config/env';

export async function GET() {
  const isDbConnected = await checkDatabaseConnection();
  let pendingJobsCount = 0;

  if (isDbConnected) {
    try {
      pendingJobsCount = await prisma.backgroundJob.count({
        where: { status: 'queued' },
      });
    } catch {
      // Ignore count error
    }
  }

  const isHealthy = isDbConnected;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      database: {
        connected: isDbConnected,
      },
      jobs: {
        pendingCount: pendingJobsCount,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        stripeConfigured: Boolean(env.STRIPE_SECRET_KEY),
        cpanelConfigured: Boolean(env.CPANEL_WHM_HOST),
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
