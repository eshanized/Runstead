import { withTenantContext } from '../db/client.ts';
import { recordAuditEvent } from './audit.service.ts';
import type { Service, Prisma } from '@prisma/client';

export interface CreateServiceInput {
  customerId: string;
  productId: string;
  orderId?: string;
  serviceName: string;
  package: string;
  domain?: string;
  billingCycle: string;
  price: number;
  ipAddress?: string;
  serverHostname?: string;
  username?: string;
  status?: string;
  resourceUsage?: Record<string, any>;
  nextRenewalDate?: Date;
}

export async function listCustomerServices(tenantId: string, customerId: string) {
  return withTenantContext(tenantId, (tx) => tx.service.findMany({
    where: {
      tenantId,
      customerId,
    },
    include: {
      product: { select: { name: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  }));;
}

export async function listResellerServices(
  tenantId: string,
  options: { status?: string; page?: number; limit?: number } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.ServiceWhereInput = {
    tenantId,
    status: options.status,
  };

  const [services, total] = await withTenantContext(tenantId, async (tx) => Promise.all([
    tx.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true, company: true } },
        product: { select: { name: true, type: true } },
      },
    }),
    tx.service.count({ where }),
  ]);

  return {
    services,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getServiceById(tenantId: string, serviceId: string) {
  return withTenantContext(tenantId, (tx) => tx.service.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: serviceId,
      },
    },
    include: {
      customer: true,
      product: true,
      order: true,
    },
  }));;
}

export async function createService(tenantId: string, input: CreateServiceInput, actorId?: string): Promise<Service> {
  const service = await withTenantContext(tenantId, (tx) => tx.service.create({
    data: {
      tenantId,
      customerId: input.customerId,
      productId: input.productId,
      orderId: input.orderId,
      serviceName: input.serviceName,
      package: input.package,
      domain: input.domain,
      billingCycle: input.billingCycle,
      price: input.price,
      ipAddress: input.ipAddress,
      serverHostname: input.serverHostname || 'srv1.runstead.infrastructure',
      username: input.username,
      status: input.status || 'active',
      resourceUsage: input.resourceUsage,
      nextRenewalDate: input.nextRenewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  }));;

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'service.created',
    resourceType: 'service',
    resourceId: service.id,
    payload: { domain: service.domain, package: service.package },
  });

  return service;
}

export async function updateServiceStatus(
  tenantId: string,
  serviceId: string,
  newStatus: string,
  reason?: string,
  actorId?: string
): Promise<Service> {
  const service = await withTenantContext(tenantId, (tx) => tx.service.update({
    where: {
      tenantId_id: {
        tenantId,
        id: serviceId,
      },
    },
    data: { status: newStatus },
  }));;

  await recordAuditEvent(tenantId, {
    actorId,
    action: `service.status_${newStatus}`,
    resourceType: 'service',
    resourceId: serviceId,
    payload: { status: newStatus, reason },
  });

  return service;
}
