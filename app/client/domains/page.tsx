'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Globe, ShieldCheck, RefreshCw, Plus, ExternalLink, Check } from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { ClientPortalLayout } from '@/components/client-portal/client-portal-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function ClientDomainsPage() {
  const { state, setState } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const activeCustomerId = state.activeClientCustomerId || state.customers[0]?.id;
  const customer = state.customers.find((c) => c.id === activeCustomerId) || state.customers[0];

  const myDomains = state.domains.filter((d) => d.customerId === customer?.id);

  function handleToggleAutoRenew(domainId: string, current: boolean) {
    setState((prev) => ({
      ...prev,
      domains: prev.domains.map((d) =>
        d.id === domainId ? { ...d, autoRenew: !current } : d
      ),
    }));
    toast.success(`Auto-renewal ${!current ? 'enabled' : 'disabled'} for domain.`);
  }

  return (
    <ClientPortalLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Registered Domains & DNS Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Registered domains, external attachments, and nameserver configurations.
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline" className="text-xs bg-white">
              <Link href="/storefront/domains/transfer">Transfer In Domain</Link>
            </Button>
            <Button asChild size="sm" className="text-xs text-white" style={{ backgroundColor: primaryColor }}>
              <Link href="/storefront/domains">Register New Domain</Link>
            </Button>
          </div>
        </div>

        {myDomains.length === 0 ? (
          <Card className="border border-dashed border-slate-300 p-12 text-center space-y-3">
            <Globe className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-base text-slate-900">No registered domains</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any registered or connected domains in this account.
            </p>
            <Button asChild size="sm" className="text-xs text-white" style={{ backgroundColor: primaryColor }}>
              <Link href="/storefront/domains">Find a Domain</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {myDomains.map((dom) => (
              <Card key={dom.id} className="border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">{dom.domain}</span>
                      <Badge
                        variant={dom.status === 'active' ? 'default' : 'secondary'}
                        className={`text-[10px] ${dom.status === 'active' ? 'bg-emerald-600' : ''}`}
                      >
                        {dom.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-slate-200">
                        {dom.domainType === 'external' ? 'External Domain' : 'Registered'}
                      </Badge>
                    </div>

                    <div className="text-slate-500 text-[11px] flex flex-wrap gap-x-4">
                      <span>Registrar: <strong className="text-slate-700">{dom.registrar}</strong></span>
                      <span>Expires: {new Date(dom.expiryDate).toLocaleDateString()}</span>
                      <span>Nameservers: {(dom.nameservers || []).join(', ') || 'Default'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">Auto-Renew:</span>
                      <Switch
                        checked={dom.autoRenew}
                        onCheckedChange={() => handleToggleAutoRenew(dom.id, dom.autoRenew)}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ClientPortalLayout>
  );
}
