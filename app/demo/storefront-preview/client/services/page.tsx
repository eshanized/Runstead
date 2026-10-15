'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Server,
  Terminal,
  RotateCcw,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/demo/selectors';
import { ClientPortalLayout } from '@/components/client-portal/client-portal-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function ClientServicesPage() {
  const { state } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const activeCustomerId = state.activeClientCustomerId || state.customers[0]?.id;
  const customer = state.customers.find((c) => c.id === activeCustomerId) || state.customers[0];

  const myServices = state.services.filter((s) => s.customerId === customer?.id);
  const [rebootingId, setRebootingId] = useState<string | null>(null);

  function handleReboot(serviceName: string, id: string) {
    setRebootingId(id);
    toast.info(`Sending reboot signal to ${serviceName}...`);
    setTimeout(() => {
      setRebootingId(null);
      toast.success(`${serviceName} rebooted successfully (Simulated).`);
    }, 1500);
  }

  function handleResetPassword(serviceName: string) {
    toast.success(`Temporary root password for ${serviceName} generated and sent to ${customer?.email}.`);
  }

  return (
    <ClientPortalLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Active Services</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your container environments, VPS virtual machines, and resource allocations.
            </p>
          </div>

          <Button asChild size="sm" className="text-xs text-white" style={{ backgroundColor: primaryColor }}>
            <Link href="/demo/storefront-preview/hosting">Order New Hosting</Link>
          </Button>
        </div>

        {myServices.length === 0 ? (
          <Card className="border border-dashed border-slate-300 p-12 text-center space-y-3">
            <Server className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-base text-slate-900">No active services</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any active compute or hosting services under this account.
            </p>
            <Button asChild size="sm" className="text-xs text-white" style={{ backgroundColor: primaryColor }}>
              <Link href="/demo/storefront-preview/hosting">Browse Catalog</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {myServices.map((srv) => (
              <Card key={srv.id} className="border border-slate-200 bg-white shadow-xs overflow-hidden">
                <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold text-slate-900">{srv.serviceName}</CardTitle>
                        <Badge
                          variant={srv.status === 'active' ? 'default' : 'secondary'}
                          className={srv.status === 'active' ? 'bg-emerald-600' : ''}
                        >
                          {srv.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Package: <strong className="text-slate-700">{srv.productName}</strong> • Renewal:{' '}
                        {srv.nextRenewalDate ? new Date(srv.nextRenewalDate).toLocaleDateString() : 'N/A'} (
                        {srv.billingCycle})
                      </CardDescription>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-extrabold text-slate-950">{formatCurrency(srv.price)}</div>
                      <div className="text-[11px] text-slate-400">/{srv.billingCycle}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6 text-xs">
                  {/* Connection Credentials */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Server IP Address
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                        {srv.ipAddress || '198.51.100.50'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Hostname
                      </span>
                      <span className="font-mono text-slate-800 text-xs mt-0.5 block truncate">
                        {srv.serverHostname || 'node1.runstead.demo'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        SSH / FTP User
                      </span>
                      <span className="font-mono text-slate-800 text-xs mt-0.5 block">
                        {srv.username || 'cust_app'}
                      </span>
                    </div>
                  </div>

                  {/* Resource Usage Bars */}
                  {srv.resourceUsage && srv.resourceUsage.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900">Current Resource Telemetry</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {srv.resourceUsage.map((res, idx) => {
                          const percent = Math.min(100, Math.round((res.used / res.total) * 100));
                          return (
                            <div key={idx} className="space-y-1.5 rounded-lg border border-slate-100 p-3">
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-slate-700">{res.label}</span>
                                <span className="text-slate-500 font-mono text-[11px]">
                                  {res.used} / {res.total} {res.unit} ({percent}%)
                                </span>
                              </div>
                              <Progress value={percent} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Server Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={rebootingId === srv.id}
                      onClick={() => handleReboot(srv.serviceName, srv.id)}
                      className="text-xs gap-1.5"
                    >
                      <RotateCcw className={`h-3.5 w-3.5 ${rebootingId === srv.id ? 'animate-spin' : ''}`} />
                      {rebootingId === srv.id ? 'Rebooting...' : 'Restart Server'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetPassword(srv.serviceName)}
                      className="text-xs gap-1.5"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Reset Credentials
                    </Button>

                    <Button asChild size="sm" variant="ghost" className="text-xs text-blue-600 gap-1.5">
                      <Link href="/demo/storefront-preview/client/tickets">
                        Request Plan Upgrade →
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ClientPortalLayout>
  );
}
