import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin, AuthorizationError, AuthenticationError } from '@/lib/auth/guards';
import { getLocalDb } from '@/lib/db/local-db';
import { prisma } from '@/lib/db/client';
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
    const db = getLocalDb();
    const rows = db.prepare('SELECT * FROM tenants ORDER BY created_at DESC').all() as any[];
    const tenants = rows.map((r) => {
      const custCount = db.prepare('SELECT count(*) as count FROM customers WHERE tenant_id = ?').get(r.id) as any;
      const orderCount = db.prepare('SELECT count(*) as count FROM orders WHERE tenant_id = ?').get(r.id) as any;
      const servCount = db.prepare('SELECT count(*) as count FROM services WHERE tenant_id = ?').get(r.id) as any;
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        planTier: r.plan_tier,
        currency: r.currency,
        createdAt: r.created_at,
        _count: {
          customers: custCount?.count || 0,
          orders: orderCount?.count || 0,
          services: servCount?.count || 0,
        },
      };
    });
    return NextResponse.json({ tenants });
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
