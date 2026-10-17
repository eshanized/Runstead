import { prisma } from '../db/client.ts';
import { getLocalDb, resolveLocalTenantId } from '../db/local-db.ts';
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

  try {
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
  } catch {
    // Resilient fallback to local SQLite persistence engine
    const db = getLocalDb();
    const resolvedTenant = resolveLocalTenantId(tenantId);
    let query = 'SELECT * FROM customers WHERE tenant_id = ?';
    const params: (string | number)[] = [resolvedTenant];
    if (!options.includeArchived) {
      query += ' AND archived = 0';
    }
    if (options.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }
    if (options.search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)';
      const s = `%${options.search.trim()}%`;
      params.push(s, s, s);
    }
    const countRow = db.prepare(`SELECT count(*) as count FROM (${query})`).get(...params) as { count: number };
    const total = countRow?.count || 0;
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, skip);
    const rows = db.prepare(query).all(...params) as any[];
    const customers = rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      userId: r.user_id,
      name: r.name,
      email: r.email,
      company: r.company,
      status: r.status,
      country: r.country,
      phone: r.phone,
      creditBalance: r.credit_balance,
      archived: Boolean(r.archived),
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      _count: { orders: 0, invoices: 0, services: 0, tickets: 0 },
    }));
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
}

export async function getCustomerById(tenantId: string, customerId: string) {
  try {
    return await prisma.customer.findUnique({
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
  } catch {
    const db = getLocalDb();
    const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId) as any;
    if (!row) return null;
    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      company: row.company,
      status: row.status,
      country: row.country,
      phone: row.phone,
      creditBalance: row.credit_balance,
      archived: Boolean(row.archived),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      orders: [],
      invoices: [],
      services: [],
      domains: [],
      tickets: [],
    } as any;
  }
}

export async function createCustomer(tenantId: string, input: CreateCustomerInput, actorId?: string): Promise<Customer> {
  try {
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
  } catch {
    const db = getLocalDb();
    const id = `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO customers (id, tenant_id, name, email, company, status, country, phone, user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      tenantId,
      input.name,
      input.email.toLowerCase().trim(),
      input.company || null,
      input.status || 'active',
      input.country || 'US',
      input.phone || null,
      input.userId || null,
      now,
      now
    );

    return {
      id,
      tenantId,
      userId: input.userId || null,
      name: input.name,
      email: input.email.toLowerCase().trim(),
      company: input.company || null,
      status: input.status || 'active',
      country: input.country || 'US',
      phone: input.phone || null,
      creditBalance: 0 as any,
      archived: false,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    } as any;
  }
}

export async function updateCustomer(
  tenantId: string,
  customerId: string,
  input: UpdateCustomerInput,
  actorId?: string
): Promise<Customer> {
  try {
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
  } catch {
    const db = getLocalDb();
    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId) as any;
    if (!existing) throw new Error('Customer not found');

    const updated = {
      name: input.name ?? existing.name,
      email: input.email ? input.email.toLowerCase().trim() : existing.email,
      company: input.company !== undefined ? input.company : existing.company,
      status: input.status ?? existing.status,
      country: input.country ?? existing.country,
      phone: input.phone !== undefined ? input.phone : existing.phone,
      archived: input.archived !== undefined ? (input.archived ? 1 : 0) : existing.archived,
    };

    db.prepare(`
      UPDATE customers
      SET name = ?, email = ?, company = ?, status = ?, country = ?, phone = ?, archived = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updated.name,
      updated.email,
      updated.company,
      updated.status,
      updated.country,
      updated.phone,
      updated.archived,
      customerId
    );

    return {
      ...existing,
      ...updated,
      archived: Boolean(updated.archived),
      updatedAt: new Date(),
    } as any;
  }
}

export async function archiveCustomer(tenantId: string, customerId: string, actorId?: string): Promise<Customer> {
  return updateCustomer(tenantId, customerId, { archived: true, status: 'inactive' }, actorId);
}

export async function linkCustomerUser(tenantId: string, customerId: string, userId: string): Promise<Customer> {
  try {
    return await prisma.customer.update({
      where: {
        tenantId_id: {
          tenantId,
          id: customerId,
        },
      },
      data: { userId },
    });
  } catch {
    const db = getLocalDb();
    db.prepare('UPDATE customers SET user_id = ? WHERE id = ?').run(userId, customerId);
    return getCustomerById(tenantId, customerId) as any;
  }
}
