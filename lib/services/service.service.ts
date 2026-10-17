import { prisma } from '../db/client.ts';
import { getLocalDb, resolveLocalTenantId } from '../db/local-db.ts';
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
  try {
    return await prisma.service.findMany({
      where: {
        tenantId,
        customerId,
      },
      include: {
        product: { select: { name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    const db = getLocalDb();
    const rows = db.prepare('SELECT * FROM services WHERE customer_id = ? ORDER BY created_at DESC').all(customerId) as any[];
    return rows.map((r) => ({
      ...r,
      serviceName: r.service_name,
      billingCycle: r.billing_cycle,
      ipAddress: r.ip_address,
      serverHostname: r.server_hostname,
      resourceUsage: r.resource_usage ? JSON.parse(r.resource_usage) : {},
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      product: { name: r.package, type: 'shared' },
    })) as any[];
  }
}

export async function listResellerServices(
  tenantId: string,
  options: { status?: string; page?: number; limit?: number } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  try {
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
  } catch {
    const db = getLocalDb();
    const resolvedTenant = resolveLocalTenantId(tenantId);
    let query = 'SELECT * FROM services WHERE tenant_id = ?';
    const params: (string | number)[] = [resolvedTenant];

    if (options.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    const countRow = db.prepare(`SELECT count(*) as count FROM (${query})`).get(...params) as { count: number };
    const total = countRow?.count || 0;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, skip);

    const rows = db.prepare(query).all(...params) as any[];
    const services = rows.map((r) => {
      const cust = db.prepare('SELECT name, email, company FROM customers WHERE id = ?').get(r.customer_id) as any;
      const prod = db.prepare('SELECT name, type FROM products WHERE id = ?').get(r.product_id) as any;

      return {
        id: r.id,
        tenantId: r.tenant_id,
        customerId: r.customer_id,
        productId: r.product_id,
        orderId: r.order_id,
        serviceName: r.service_name,
        package: r.package,
        domain: r.domain,
        billingCycle: r.billing_cycle,
        price: r.price,
        ipAddress: r.ip_address,
        serverHostname: r.server_hostname,
        username: r.username,
        status: r.status,
        resourceUsage: r.resource_usage ? JSON.parse(r.resource_usage) : {},
        nextRenewalDate: r.next_renewal_date ? new Date(r.next_renewal_date) : null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
        customer: cust || { name: 'Customer', email: 'user@example.com', company: null },
        product: prod || { name: r.package, type: 'shared' },
      };
    });

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
}

export async function getServiceById(tenantId: string, serviceId: string) {
  try {
    return await prisma.service.findUnique({
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
  } catch {
    const db = getLocalDb();
    const row = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId) as any;
    if (!row) return null;
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(row.customer_id) as any;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(row.product_id) as any;

    return {
      ...row,
      serviceName: row.service_name,
      billingCycle: row.billing_cycle,
      ipAddress: row.ip_address,
      serverHostname: row.server_hostname,
      resourceUsage: row.resource_usage ? JSON.parse(row.resource_usage) : {},
      customer,
      product,
    };
  }
}

export async function createServiceRecord(
  tenantId: string,
  input: CreateServiceInput,
  actorId?: string
): Promise<Service> {
  try {
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
  } catch {
    const db = getLocalDb();
    const resolvedTenant = resolveLocalTenantId(tenantId);
    const id = `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO services (id, tenant_id, customer_id, product_id, order_id, service_name, package, domain, billing_cycle, price, ip_address, server_hostname, username, status, resource_usage, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      resolvedTenant,
      input.customerId,
      input.productId,
      input.orderId || null,
      input.serviceName,
      input.package,
      input.domain || null,
      input.billingCycle,
      input.price,
      input.ipAddress || null,
      input.serverHostname || null,
      input.username || null,
      input.status || 'pending',
      JSON.stringify(input.resourceUsage || {}),
      now,
      now
    );

    return {
      id,
      tenantId: resolvedTenant,
      customerId: input.customerId,
      productId: input.productId,
      orderId: input.orderId || null,
      serviceName: input.serviceName,
      package: input.package,
      domain: input.domain || null,
      billingCycle: input.billingCycle,
      price: input.price as any,
      ipAddress: input.ipAddress || null,
      serverHostname: input.serverHostname || null,
      username: input.username || null,
      status: input.status || 'pending',
      resourceUsage: input.resourceUsage || {},
      createdAt: new Date(now),
      updatedAt: new Date(now),
    } as any;
  }
}

export async function updateServiceStatus(
  tenantId: string,
  serviceId: string,
  status: string,
  provisioningError?: string | null,
  actorId?: string
): Promise<Service> {
  try {
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
  } catch {
    const db = getLocalDb();
    db.prepare('UPDATE services SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, serviceId);
    return getServiceById(tenantId, serviceId) as any;
  }
}

export async function updateServiceUsage(
  tenantId: string,
  serviceId: string,
  resourceUsage: Record<string, any>
): Promise<Service> {
  try {
    return await prisma.service.update({
      where: {
        tenantId_id: {
          tenantId,
          id: serviceId,
        },
      },
      data: { resourceUsage },
    });
  } catch {
    const db = getLocalDb();
    db.prepare('UPDATE services SET resource_usage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      JSON.stringify(resourceUsage),
      serviceId
    );
    return getServiceById(tenantId, serviceId) as any;
  }
}
