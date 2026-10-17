import { NextResponse } from 'next/server';
import { processPendingJobs } from '@/lib/jobs/queue';
import { env } from '@/lib/config/env';

export async function POST(req: Request) {
  // Validate authorization header for background worker invocation
  const authHeader = req.headers.get('authorization');
  const expectedSecret = env.AUTH_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized worker invocation' }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  const report = await processPendingJobs({ limit });
  return NextResponse.json({
    success: true,
    report,
  });
}
