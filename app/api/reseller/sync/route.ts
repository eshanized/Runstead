import { NextResponse } from 'next/server';
import { requireResellerStaff, AuthenticationError } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/client';
import { listCustomers } from '@/lib/services/customer.service';
import { listProducts } from '@/lib/services/product.service';
import { listOrders } from '@/lib/services/order.service';
import { listInvoices } from '@/lib/services/invoice.service';
import { listResellerServices } from '@/lib/services/service.service';
import { listTickets } from '@/lib/services/ticket.service';

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

  const [
    custResult,
    prodResult,
    ordResult,
    invResult,
    servResult,
    tickResult,
    domainRows,
    dnsRecords,
    providerRows,
    tenantRow,
  ] = await Promise.all([
    listCustomers(tenantId, { limit: 100 }),
    listProducts(tenantId, { availableOnly: false }),
    listOrders(tenantId, { limit: 100 }),
    listInvoices(tenantId, { limit: 100 }),
    listResellerServices(tenantId, { limit: 100 }),
    listTickets(tenantId, { limit: 100 }),
    prisma.domain.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
    prisma.dnsRecord.findMany({
      where: { tenantId },
      include: { domain: { select: { domainName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.providerCredential.findMany({
      where: { tenantId },
      select: { id: true, providerName: true, status: true, lastTestedAt: true },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
  ]);

  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    tenant: {
      id: tenantRow?.id || tenantId,
      name: tenantRow?.name || 'Runstead Platform',
      slug: tenantRow?.slug || 'default',
      currency: tenantRow?.currency || 'USD',
      taxRate: Number(tenantRow?.taxRate || 0.0),
      brand: tenantRow?.brandConfig || {},
      business: tenantRow?.businessSettings || {},
    },
    customers: custResult.customers,
    products: prodResult,
    orders: ordResult.orders,
    invoices: invResult.invoices,
    services: servResult.services,
    tickets: tickResult.tickets,
    domains: domainRows.map((d) => ({
      id: d.id,
      domain: d.domainName,
      domainName: d.domainName,
      customerId: d.customerId,
      status: d.status,
      registeredDate: d.registeredDate || '',
      expiryDate: d.expiryDate || '',
      autoRenew: Boolean(d.autoRenew),
      nameservers: Array.isArray(d.nameservers) ? d.nameservers : [],
    })),
    dnsRecords: dnsRecords.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      domainId: r.domainId,
      domain: r.domain?.domainName,
      type: r.type,
      host: r.host,
      value: r.value,
      ttl: r.ttl,
      priority: r.priority,
    })),
    integrations: providerRows.map((p) => ({
      id: p.id,
      name: p.providerName,
      providerName: p.providerName,
      status: p.status,
      lastVerifiedAt: p.lastTestedAt,
      lastTestedAt: p.lastTestedAt,
    })),
  });
}
