import { prisma } from '../db/client.ts';
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
  return prisma.service.findMany({
    where: {
      tenantId,
      customerId,
    },
    include: {
      product: { select: { name: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
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

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true, company: true } },
        product: { select: { name: true, type: true } },
      },
    }),
    prisma.service.count({ where }),
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
  return prisma.service.findUnique({
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
  });
}

export async function createServiceRecord(
  tenantId: string,
  input: CreateServiceInput,
  actorId?: string
): Promise<Service> {
  const service = await prisma.service.create({
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
      serverHostname: input.serverHostname,
      username: input.username,
      status: input.status || 'pending',
      resourceUsage: input.resourceUsage,
      nextRenewalDate: input.nextRenewalDate,
    },
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'service.created',
    resourceType: 'service',
    resourceId: service.id,
    payload: {
      serviceName: service.serviceName,
      username: service.username,
      package: service.package,
    },
  });

  return service;
}

export async function updateServiceStatus(
  tenantId: string,
  serviceId: string,
  status: string,
  provisioningError?: string | null,
  actorId?: string
): Promise<Service> {
  const service = await prisma.service.update({
    where: {
      tenantId_id: {
        tenantId,
        id: serviceId,
      },
    },
    data: {
      status,
      provisioningError,
    },
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: `service.status_${status}`,
    resourceType: 'service',
    resourceId: serviceId,
    payload: { status, provisioningError },
  });

  return service;
}

export async function updateServiceUsage(
  tenantId: string,
  serviceId: string,
  resourceUsage: Record<string, any>
): Promise<Service> {
  return prisma.service.update({
    where: {
      tenantId_id: {
        tenantId,
        id: serviceId,
      },
    },
    data: { resourceUsage },
  });
}
