import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin, AuthorizationError, AuthenticationError } from '@/lib/auth/guards';
import { adminPrisma as prisma } from '@/lib/db/client';
import { createResellerTenant } from '@/lib/services/tenant.service';

const createTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  planTier: z.string().default('Growth'),
  currency: z.string().default('USD'),
});

export async function GET(req: Request) {
  try {
    await requirePlatformAdmin(req);
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            customers: true,
            orders: true,
            services: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ tenants });
  } catch {
    return NextResponse.json({ error: 'Platform tenant data is temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(req: Request) {
  let user;
  try {
    user = await requirePlatformAdmin(req);
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

  const parsed = createTenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const tenant = await createResellerTenant(user.id, parsed.data);
    return NextResponse.json({ success: true, tenant }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create reseller tenant' },
      { status: 400 }
    );
  }
}
