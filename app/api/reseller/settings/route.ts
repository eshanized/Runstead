import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireResellerStaff, AuthorizationError, AuthenticationError } from '@/lib/auth/guards';
import { getLocalDb, resolveLocalTenantId } from '@/lib/db/local-db';
import { prisma } from '@/lib/db/client';
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
  const tenantId = url.searchParams.get('tenantId') || 'default';

  try {
    await requireResellerStaff(tenantId, ['owner', 'admin', 'billing', 'support'], req);
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  const db = getLocalDb();
  const resolvedTenant = resolveLocalTenantId(tenantId);
  const row = db.prepare('SELECT * FROM tenants WHERE id = ?').get(resolvedTenant) as any;

  if (!row) {
    return NextResponse.json({ error: 'Tenant settings not found' }, { status: 404 });
  }

  return NextResponse.json({
    settings: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      planTier: row.plan_tier,
      currency: row.currency,
      taxRate: row.tax_rate,
      brandConfig: row.brand_config ? JSON.parse(row.brand_config) : {},
      businessSettings: row.business_settings ? JSON.parse(row.business_settings) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  });
}

export async function PATCH(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

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

  const db = getLocalDb();
  const resolvedTenant = resolveLocalTenantId(tenantId);
  const existing = db.prepare('SELECT * FROM tenants WHERE id = ?').get(resolvedTenant) as any;

  if (!existing) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const updatedName = parsed.data.name ?? existing.name;
  const updatedCurrency = parsed.data.currency ?? existing.currency;
  const updatedTaxRate = parsed.data.taxRate !== undefined ? parsed.data.taxRate : existing.tax_rate;
  const updatedBrandConfig = parsed.data.brandConfig ? JSON.stringify(parsed.data.brandConfig) : existing.brand_config;
  const updatedBusinessSettings = parsed.data.businessSettings ? JSON.stringify(parsed.data.businessSettings) : existing.business_settings;

  db.prepare(`
    UPDATE tenants
    SET name = ?, currency = ?, tax_rate = ?, brand_config = ?, business_settings = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(updatedName, updatedCurrency, updatedTaxRate, updatedBrandConfig, updatedBusinessSettings, resolvedTenant);

  await recordAuditEvent(resolvedTenant, {
    actorId: user.id,
    action: 'settings.updated',
    resourceType: 'tenant_settings',
    resourceId: resolvedTenant,
    payload: { name: updatedName, currency: updatedCurrency, taxRate: updatedTaxRate },
  });

  return NextResponse.json({
    success: true,
    settings: {
      id: resolvedTenant,
      name: updatedName,
      slug: existing.slug,
      planTier: existing.plan_tier,
      currency: updatedCurrency,
      taxRate: updatedTaxRate,
      brandConfig: updatedBrandConfig ? JSON.parse(updatedBrandConfig) : {},
      businessSettings: updatedBusinessSettings ? JSON.parse(updatedBusinessSettings) : {},
    },
    message: 'Business settings and branding updated successfully.',
  });
}
