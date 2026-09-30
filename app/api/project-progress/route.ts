import { NextRequest, NextResponse } from 'next/server';
import { getProjectProgress } from '@/lib/github/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const data = await getProjectProgress(forceRefresh);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      {
        error: 'Failed to retrieve project progress data',
        details: message,
      },
      {
        status: 500,
      }
    );
  }
}
