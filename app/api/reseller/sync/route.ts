import { NextResponse } from 'next/server';
import { requireResellerStaff, AuthenticationError } from '@/lib/auth/guards';
import { withTenantContext } from '@/lib/db/client';
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

  try {
    const [
      custResult,
      prodResult,
      ordResult,
      invResult,
      servResult,
      tickResult,
      tenantData,
    ] = await Promise.all([
      listCustomers(tenantId, { limit: 100 }),
      listProducts(tenantId, { availableOnly: false }),
      listOrders(tenantId, { limit: 100 }),
      listInvoices(tenantId, { limit: 100 }),
      listResellerServices(tenantId, { limit: 100 }),
      listTickets(tenantId, { limit: 100 }),
      withTenantContext(tenantId, async (tx) => {
        const [domains, dnsRecords, providerRows, tenant] = await Promise.all([
          tx.domain.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
          tx.dnsRecord.findMany({
            where: { tenantId },
            include: { domain: { select: { domainName: true } } },
            orderBy: { createdAt: 'desc' },
          }),
          tx.providerCredential.findMany({
            where: { tenantId },
            select: { id: true, providerName: true, status: true, lastTestedAt: true },
          }),
          tx.tenant.findUnique({ where: { id: tenantId } }),
        ]);
        return { domains, dnsRecords, providerRows, tenant };
      }),
    ]);

    const tenantRow = tenantData.tenant;
    if (!tenantRow) {
      return NextResponse.json({ error: 'Tenant not found in the authorized scope.' }, { status: 404 });
    }

    return NextResponse.json({
      syncedAt: new Date().toISOString(),
      tenant: {
        id: tenantRow.id,
        name: tenantRow.name,
        slug: tenantRow.slug,
        currency: tenantRow.currency,
        taxRate: Number(tenantRow.taxRate),
        brand: tenantRow.brandConfig || {},
        business: tenantRow.businessSettings || {},
      },
      customers: custResult.customers,
      products: prodResult,
      orders: ordResult.orders,
      invoices: invResult.invoices,
      services: servResult.services,
      tickets: tickResult.tickets,
      domains: tenantData.domains.map((d) => ({
        id: d.id,
        domain: d.domainName,
        domainName: d.domainName,
        customerId: d.customerId,
        status: d.status,
        registrar: d.registrar,
        registeredDate: d.registeredDate,
        expiryDate: d.expiryDate,
        autoRenew: d.autoRenew,
        nameservers: Array.isArray(d.nameservers) ? d.nameservers : [],
        domainType: d.domainType,
      })),
      dnsRecords: tenantData.dnsRecords.map((r) => ({
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
      integrations: tenantData.providerRows.map((p) => ({
        id: p.id,
        name: p.providerName,
        providerName: p.providerName,
        status: p.status,
        lastVerifiedAt: p.lastTestedAt,
        lastTestedAt: p.lastTestedAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Tenant data is temporarily unavailable.' }, { status: 503 });
  }
}
