import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireResellerStaff, AuthenticationError } from '@/lib/auth/guards';
import { withTenantContext } from '@/lib/db/client';
import { recordAuditEvent } from '@/lib/services/audit.service';

const updateSettingsSchema = z.object({
  name: z.string().min(2).optional(),
  currency: z.string().length(3).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  brandConfig: z.record(z.any()).optional(),
  businessSettings: z.record(z.any()).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  try {
    await requireResellerStaff(tenantId, ['owner', 'admin', 'billing', 'support'], req);
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  try {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.tenant.findUnique({ where: { id: tenantId } })
    );
    if (!row) {
      return NextResponse.json({ error: 'Tenant settings not found' }, { status: 404 });
    }

    return NextResponse.json({
      settings: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        planTier: row.planTier,
        currency: row.currency,
        taxRate: Number(row.taxRate),
        brandConfig: row.brandConfig || {},
        businessSettings: row.businessSettings || {},
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Tenant settings are temporarily unavailable.' }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  let user;
  try {
    const auth = await requireResellerStaff(tenantId, ['owner', 'admin'], req);
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

  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const updated = await withTenantContext(tenantId, (tx) =>
      tx.tenant.update({
        where: { id: tenantId },
        data: {
          name: parsed.data.name,
          currency: parsed.data.currency,
          taxRate: parsed.data.taxRate,
          brandConfig: parsed.data.brandConfig,
          businessSettings: parsed.data.businessSettings,
        },
      })
    );

    await recordAuditEvent(tenantId, {
      actorId: user.id,
      action: 'settings.updated',
      resourceType: 'tenant_settings',
      resourceId: tenantId,
      payload: {
        name: updated.name,
        currency: updated.currency,
        taxRate: Number(updated.taxRate),
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        planTier: updated.planTier,
        currency: updated.currency,
        taxRate: Number(updated.taxRate),
        brandConfig: updated.brandConfig || {},
        businessSettings: updated.businessSettings || {},
      },
      message: 'Business settings and branding updated successfully.',
    });
  } catch {
    return NextResponse.json({ error: 'Unable to update tenant settings.' }, { status: 503 });
  }
}
