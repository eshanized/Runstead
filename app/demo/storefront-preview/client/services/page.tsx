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
  AlertTriangle,
  FolderTree,
  Database,
  Mail,
  Archive,
  Lock,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/demo/selectors';
import { ClientPortalLayout } from '@/components/client-portal/client-portal-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function ClientServicesPage() {
  const { state, setState } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const activeCustomerId = state.activeClientCustomerId || state.customers[0]?.id;
  const customer = state.customers.find((c) => c.id === activeCustomerId) || state.customers[0];

  // Get active services for this customer (or all if filter not found)
  const myServices = state.services.filter((s) => s.customerId === customer?.id);
  const [rebootingId, setRebootingId] = useState<string | null>(null);

  function handleReboot(serviceName: string, id: string) {
    setRebootingId(id);
    toast.info(`Sending reboot signal to ${serviceName}...`);

    setTimeout(() => {
      setRebootingId(null);
      // Add log to service
      const nextServices = state.services.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            timeline: [
              {
                id: `tl_${Date.now()}`,
                event: 'Server Rebooted',
                description: 'Reboot triggered by customer portal',
                timestamp: new Date().toISOString(),
              },
              ...s.timeline,
            ],
            logs: [
              {
                id: `lg_${Date.now()}`,
                timestamp: new Date().toISOString(),
                severity: 'info' as const,
                category: 'system' as const,
                message: `Server reboot executed successfully`,
              },
              ...(s.logs || []),
            ],
          };
        }
        return s;
      });
      setState({ ...state, services: nextServices });
      toast.success(`${serviceName} rebooted successfully (Simulated).`);
    }, 1200);
  }

  function handleResetPassword(serviceName: string, id: string) {
    const nextServices = state.services.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          logs: [
            {
              id: `lg_${Date.now()}`,
              timestamp: new Date().toISOString(),
              severity: 'info' as const,
              category: 'auth' as const,
              message: `Credentials reset request dispatched to ${customer?.email}`,
            },
            ...(s.logs || []),
          ],
        };
      }
      return s;
    });
    setState({ ...state, services: nextServices });
    toast.success(`Temporary root password for ${serviceName} generated and sent to ${customer?.email}.`);
  }

  return (
    <ClientPortalLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Active Services & Hosting Accounts</h1>
            <p className="text-xs text-slate-500 mt-1">
              Select any hosting account or virtual server below to open its dedicated Hosting Control Center.
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
            {myServices.map((srv) => {
              const storageUsage = srv.resourceUsage?.find(
                (r) => r.type === 'storage' || r.label.toLowerCase().includes('storage') || r.label.toLowerCase().includes('disk')
              );
              const isStorageCritical =
                storageUsage && storageUsage.used / storageUsage.total >= 0.85;

              return (
                <Card key={srv.id} className="border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-bold text-slate-900">{srv.serviceName}</CardTitle>
                          <Badge
                            variant={srv.status === 'active' ? 'default' : 'secondary'}
                            className={srv.status === 'active' ? 'bg-emerald-600 text-white' : ''}
                          >
                            {srv.status.toUpperCase()}
                          </Badge>

                          {isStorageCritical && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] gap-1">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              Storage Critical ({Math.round((storageUsage.used / storageUsage.total) * 100)}%)
                            </Badge>
                          )}
                        </div>

                        <CardDescription className="text-xs mt-1">
                          Package: <strong className="text-slate-800">{srv.productName}</strong> • Domain:{' '}
                          <span className="font-mono font-medium text-slate-700">{srv.domain || 'N/A'}</span> • Renewal:{' '}
                          {srv.nextRenewalDate ? new Date(srv.nextRenewalDate).toLocaleDateString() : 'N/A'} (
                          {srv.billingCycle})
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <div className="text-xl font-extrabold text-slate-950">{formatCurrency(srv.price)}</div>
                          <div className="text-[11px] text-slate-400">/{srv.billingCycle}</div>
                        </div>

                        <Button
                          asChild
                          size="sm"
                          className="text-xs text-white shadow-xs gap-1.5"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Link href={`/demo/storefront-preview/client/services/${srv.id}`}>
                            Open Control Center <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
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
                          {srv.serverHostname || 'node1.runstead.tonmoyinfrastructure.org'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          SSH / Control User
                        </span>
                        <span className="font-mono text-slate-800 text-xs mt-0.5 block">
                          {srv.username || 'cust_app'}
                        </span>
                      </div>
                    </div>

                    {/* Enabled Capabilities Badges */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Available Management Features
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {srv.capabilities && srv.capabilities.length > 0 ? (
                          srv.capabilities.map((cap) => (
                            <Badge
                              key={cap}
                              variant="secondary"
                              className="text-[10px] font-mono capitalize bg-slate-100 text-slate-700"
                            >
                              {cap.replace(/_/g, ' ')}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">Standard Hosting Suite</span>
                        )}
                      </div>
                    </div>

                    {/* Resource Usage Bars */}
                    {srv.resourceUsage && srv.resourceUsage.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-900">Current Resource Telemetry</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {srv.resourceUsage.map((res, idx) => {
                            const percent = Math.min(100, Math.round((res.used / res.total) * 100));
                            const isCrit = percent >= 85;

                            return (
                              <div key={idx} className="space-y-1.5 rounded-lg border border-slate-100 p-3">
                                <div className="flex justify-between text-xs">
                                  <span className="font-semibold text-slate-700">{res.label}</span>
                                  <span className={`font-mono text-[11px] ${isCrit ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                                    {res.used} / {res.total} {res.unit} ({percent}%)
                                  </span>
                                </div>
                                <Progress
                                  value={percent}
                                  className={`h-2 ${isCrit ? '[&>div]:bg-amber-500' : ''}`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Server Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
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
                          onClick={() => handleResetPassword(srv.serviceName, srv.id)}
                          className="text-xs gap-1.5"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Reset Credentials
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button asChild size="sm" variant="ghost" className="text-xs text-blue-600 gap-1.5">
                          <Link href={`/demo/storefront-preview/client/services/${srv.id}/settings`}>
                            Plan Upgrade Wizard →
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ClientPortalLayout>
  );
}
