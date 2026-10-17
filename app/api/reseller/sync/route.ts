import { NextResponse } from 'next/server';
import { requireResellerStaff, AuthorizationError, AuthenticationError } from '@/lib/auth/guards';
import { getLocalDb, resolveLocalTenantId } from '@/lib/db/local-db';
import { listCustomers } from '@/lib/services/customer.service';
import { listProducts } from '@/lib/services/product.service';
import { listOrders } from '@/lib/services/order.service';
import { listInvoices } from '@/lib/services/invoice.service';
import { listResellerServices } from '@/lib/services/service.service';
import { listTickets } from '@/lib/services/ticket.service';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

  try {
    await requireResellerStaff(tenantId, ['owner', 'admin', 'billing', 'support'], req);
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  const resolvedTenant = resolveLocalTenantId(tenantId);
  const db = getLocalDb();

  const [
    custResult,
    prodResult,
    ordResult,
    invResult,
    servResult,
    tickResult,
  ] = await Promise.all([
    listCustomers(tenantId, { limit: 100 }),
    listProducts(tenantId, { availableOnly: false }),
    listOrders(tenantId, { limit: 100 }),
    listInvoices(tenantId, { limit: 100 }),
    listResellerServices(tenantId, { limit: 100 }),
    listTickets(tenantId, { limit: 100 }),
  ]);

  const dnsRecords = db.prepare('SELECT * FROM dns_records WHERE tenant_id = ?').all(resolvedTenant);
  const domainRows = db.prepare('SELECT * FROM domains WHERE tenant_id = ?').all(resolvedTenant) as any[];
  const providerRows = db.prepare('SELECT id, provider_name, status, last_verified_at, updated_at FROM provider_credentials WHERE tenant_id = ?').all(resolvedTenant) as any[];
  const tenantRow = db.prepare('SELECT * FROM tenants WHERE id = ?').get(resolvedTenant) as any;

  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    tenant: {
      id: resolvedTenant,
      name: tenantRow?.name || 'Runstead Platform',
      slug: tenantRow?.slug || 'default',
      currency: tenantRow?.currency || 'USD',
      taxRate: tenantRow?.tax_rate || 0.0,
      brand: tenantRow?.brand_config ? JSON.parse(tenantRow.brand_config) : {},
      business: tenantRow?.business_settings ? JSON.parse(tenantRow.business_settings) : {},
    },
    customers: custResult.customers,
    products: prodResult,
    orders: ordResult.orders,
    invoices: invResult.invoices,
    services: servResult.services,
    tickets: tickResult.tickets,
    domains: domainRows.map((d) => ({
      id: d.id,
      domain: d.domain,
      customerId: d.customer_id,
      status: d.status,
      registeredDate: d.registered_at,
      expiryDate: d.expires_at || new Date().toISOString(),
      autoRenew: Boolean(d.auto_renew),
      nameservers: d.nameservers ? (typeof d.nameservers === 'string' ? JSON.parse(d.nameservers) : d.nameservers) : ['ns1.runstead.net', 'ns2.runstead.net'],
      dnsZoneId: d.dns_zone_id,
    })),
    dnsRecords,
    integrations: providerRows.map((p) => ({
      id: p.id,
      name: p.provider_name,
      status: p.status,
      lastVerifiedAt: p.last_verified_at,
    })),
  });
}
