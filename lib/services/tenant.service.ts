import { prisma } from '../db/client.ts';
import { recordAuditEvent } from './audit.service.ts';
import type { Tenant } from '@prisma/client';

export interface CreateTenantInput {
  name: string;
  slug: string;
  planTier?: string;
  currency?: string;
  taxRate?: number;
  brandConfig?: Record<string, any>;
  businessSettings?: Record<string, any>;
}

/**
 * Onboards a new reseller business tenant.
 * Atomically creates the tenant and assigns the owner membership to the user.
 */
export async function createResellerTenant(ownerUserId: string, input: CreateTenantInput): Promise<Tenant> {
  const normalizedSlug = input.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

  const tenant = await prisma.$transaction(async (tx) => {
    // 1. Create tenant record
    const created = await tx.tenant.create({
      data: {
        name: input.name,
        slug: normalizedSlug,
        planTier: input.planTier || 'Launch',
        currency: input.currency || 'USD',
        taxRate: input.taxRate ?? 0.00,
        brandConfig: input.brandConfig || {
          brandName: input.name,
          primaryColor: '#0ea5e9',
        },
        businessSettings: input.businessSettings || {
          companyName: input.name,
          supportEmail: `support@${normalizedSlug}.com`,
        },
      },
    });

    // 2. Link owner user
    await tx.tenantMembership.create({
      data: {
        tenantId: created.id,
        userId: ownerUserId,
        role: 'owner',
      },
    });

    return created;
  });

  await recordAuditEvent(tenant.id, {
    actorId: ownerUserId,
    actorType: 'user',
    action: 'tenant.created',
    resourceType: 'tenant',
    resourceId: tenant.id,
    payload: { name: tenant.name, slug: tenant.slug },
  });

  return tenant;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({
    where: { slug: slug.toLowerCase() },
  });
}

export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
  });
}

export async function updateTenantBrand(
  tenantId: string,
  brandConfig: Record<string, any>,
  actorId?: string
): Promise<Tenant> {
  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { brandConfig },
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'tenant.brand_updated',
    resourceType: 'tenant',
    resourceId: tenantId,
    payload: brandConfig,
  });

  return updated;
}
