import { prisma } from '../db/client.ts';
import { recordAuditEvent } from './audit.service.ts';
import type { Customer, Prisma } from '@prisma/client';

export interface ListCustomersOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  includeArchived?: boolean;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  company?: string;
  status?: string;
  country?: string;
  phone?: string;
  userId?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  company?: string;
  status?: string;
  country?: string;
  phone?: string;
  creditBalance?: number;
  archived?: boolean;
}

export async function listCustomers(tenantId: string, options: ListCustomersOptions = {}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.CustomerWhereInput = {
    tenantId,
    archived: options.includeArchived ? undefined : false,
    status: options.status ? options.status : undefined,
  };

  if (options.search) {
    const s = options.search.trim();
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
      { company: { contains: s, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            orders: true,
            invoices: true,
            services: true,
            tickets: true,
          },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCustomerById(tenantId: string, customerId: string) {
  return prisma.customer.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: customerId,
      },
    },
    include: {
      orders: { orderBy: { createdAt: 'desc' }, take: 10 },
      invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
      services: { orderBy: { createdAt: 'desc' } },
      domains: { orderBy: { createdAt: 'desc' } },
      tickets: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
}

export async function createCustomer(tenantId: string, input: CreateCustomerInput, actorId?: string): Promise<Customer> {
  const customer = await prisma.customer.create({
    data: {
      tenantId,
      name: input.name,
      email: input.email.toLowerCase().trim(),
      company: input.company,
      status: input.status || 'active',
      country: input.country || 'US',
      phone: input.phone,
      userId: input.userId,
    },
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'customer.created',
    resourceType: 'customer',
    resourceId: customer.id,
    payload: { name: customer.name, email: customer.email },
  });

  return customer;
}

export async function updateCustomer(
  tenantId: string,
  customerId: string,
  input: UpdateCustomerInput,
  actorId?: string
): Promise<Customer> {
  const customer = await prisma.customer.update({
    where: {
      tenantId_id: {
        tenantId,
        id: customerId,
      },
    },
    data: {
      ...input,
      email: input.email ? input.email.toLowerCase().trim() : undefined,
    },
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'customer.updated',
    resourceType: 'customer',
    resourceId: customer.id,
    payload: input,
  });

  return customer;
}

export async function archiveCustomer(tenantId: string, customerId: string, actorId?: string): Promise<Customer> {
  return updateCustomer(tenantId, customerId, { archived: true, status: 'inactive' }, actorId);
}

export async function linkCustomerUser(tenantId: string, customerId: string, userId: string): Promise<Customer> {
  return prisma.customer.update({
    where: {
      tenantId_id: {
        tenantId,
        id: customerId,
      },
    },
    data: { userId },
  });
}
