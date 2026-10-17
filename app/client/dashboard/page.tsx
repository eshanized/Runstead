'use client';

import Link from 'next/link';
import {
  Server,
  Globe,
  FileText,
  LifeBuoy,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { usePlatformStore } from '@/lib/store/platform-store';
import { formatCurrency, relativeTime } from '@/lib/platform/selectors';
import * as workflows from '@/lib/platform/workflows';
import { ClientPortalLayout } from '@/components/client-portal/client-portal-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ClientDashboardPage() {
  const { state, syncFromServer } = usePlatformStore();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const activeCustomerId = state.activeClientCustomerId || state.customers[0]?.id;
  const customer = state.customers.find((c: any) => c.id === activeCustomerId) || state.customers[0];

  // Isolated customer records
  const myServices = state.services.filter((s: any) => s.customerId === customer?.id);
  const myDomains = state.domains.filter((d: any) => d.customerId === customer?.id);
  const myInvoices = state.invoices.filter((i: any) => i.customerId === customer?.id);
  const myTickets = state.tickets.filter((t: any) => t.customerId === customer?.id);

  const unpaidInvoices = myInvoices.filter((i: any) => i.status === 'sent' || i.status === 'overdue');
  const openTickets = myTickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress');

  async function handlePayInvoice(invoiceId: string) {
    if (!customer) return;
    try {
      const res = await fetch(`/api/portal/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'card' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment failed');
      }
      await syncFromServer();
      toast.success('Payment settled successfully! Transaction recorded in PostgreSQL.');
    } catch (err: any) {
      toast.error(err.message || 'Payment processing failed');
    }
  }

  return (
    <ClientPortalLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {customer?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Account Overview • {customer?.company ? `${customer.company} • ` : ''}
              {customer?.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="text-xs bg-white">
              <Link href="/client/tickets">
                <LifeBuoy className="mr-1.5 h-3.5 w-3.5" /> Open Ticket
              </Link>
            </Button>
            <Button asChild size="sm" className="text-xs text-white" style={{ backgroundColor: primaryColor }}>
              <Link href="/storefront/hosting">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Order New Service
              </Link>
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border border-slate-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Active Services</span>
              <Server className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-950">{myServices.length}</div>
            <div className="text-[11px] text-slate-400">Containers & Cloud VPS</div>
          </Card>

          <Card className="border border-slate-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Registered Domains</span>
              <Globe className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-950">{myDomains.length}</div>
            <div className="text-[11px] text-slate-400">Active Nameserver Zones</div>
          </Card>

          <Card className="border border-slate-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Invoices Due</span>
              <FileText className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-950">{unpaidInvoices.length}</div>
            <div className="text-[11px] text-slate-400">
              {unpaidInvoices.length > 0 ? 'Pending settlement' : 'All accounts settled'}
            </div>
          </Card>

          <Card className="border border-slate-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Support Tickets</span>
              <LifeBuoy className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-950">{openTickets.length}</div>
            <div className="text-[11px] text-slate-400">Open or in-progress</div>
          </Card>
        </div>

        {/* Two Columns: Services & Invoices */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Active Services */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-600" />
                My Hosting & Compute Services
              </h2>
              <Link href="/client/services" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                View All ({myServices.length}) →
              </Link>
            </div>

            {myServices.length === 0 ? (
              <Card className="border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                You have no active services yet.
                <div className="pt-2">
                  <Button asChild size="sm" className="text-xs text-white" style={{ backgroundColor: primaryColor }}>
                    <Link href="/storefront/hosting">Browse Hosting Catalog</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {myServices.slice(0, 3).map((srv) => (
                  <Card key={srv.id} className="border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{srv.serviceName}</span>
                          <Badge
                            variant={srv.status === 'active' ? 'default' : 'secondary'}
                            className={`text-[10px] ${srv.status === 'active' ? 'bg-emerald-600' : ''}`}
                          >
                            {srv.status}
                          </Badge>
                        </div>
                        <div className="text-slate-500 text-[11px] flex flex-wrap gap-x-3">
                          <span>IP: <strong className="text-slate-700">{srv.ipAddress || '198.51.100.50'}</strong></span>
                          <span>Host: <strong className="text-slate-700">{srv.serverHostname || 'node1.runstead.tonmoyinfrastructure.org'}</strong></span>
                          <span>Renewal: {srv.nextRenewalDate ? new Date(srv.nextRenewalDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline" className="text-xs h-8 bg-white">
                          <Link href="/client/services">
                            Manage
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Invoices & Billing */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" />
                Recent Invoices
              </h2>
              <Link href="/client/invoices" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                View All ({myInvoices.length}) →
              </Link>
            </div>

            {myInvoices.length === 0 ? (
              <Card className="border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                No invoices found for this account.
              </Card>
            ) : (
              <div className="space-y-3">
                {myInvoices.slice(0, 3).map((inv) => (
                  <Card key={inv.id} className="border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{inv.invoiceNumber}</span>
                          <Badge
                            variant={inv.status === 'paid' ? 'default' : 'secondary'}
                            className={`text-[10px] ${inv.status === 'paid' ? 'bg-emerald-600' : 'bg-amber-100 text-amber-800'}`}
                          >
                            {inv.status}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Due: {new Date(inv.dueDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-slate-950 text-sm">
                          {formatCurrency(inv.total)}
                        </span>
                        {inv.status !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => handlePayInvoice(inv.id)}
                            className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          >
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientPortalLayout>
  );
}
