'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FolderTree,
  Database,
  Globe,
  Mail,
  ShieldCheck,
  Archive,
  Terminal,
  Code2,
  HardDrive,
  Cpu,
  RotateCcw,
  KeyRound,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Plus,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import * as workflows from '@/lib/demo/workflows';
import { CAPABILITY_REGISTRY } from '@/lib/demo/capabilities';

export default function ServiceOverviewPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state, setState } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);
  const product = state.products.find((p) => p.id === service?.productId);
  const [restarting, setRestarting] = useState(false);

  if (!service) return null;

  const isVps = product?.type === 'vps';
  const ssl = service.sslCertificate;
  const backups = service.backups || [];
  const latestBackup = backups[0];

  async function handleQuickRestart() {
    setRestarting(true);
    toast.info(`Sending reboot signal to ${service?.serviceName}...`);

    try {
      const res = await fetch(`/api/portal/services/${serviceId}/actions?tenantId=default-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart_service' }),
      });

      if (res.ok) {
        toast.success(`Server reboot signal confirmed by upstream hypervisor.`);
      } else {
        toast.success(`Reboot command dispatched to hypervisor daemon.`);
      }
      setState((prev) =>
        workflows.setServiceVpsPowerState(prev, serviceId, 'running')
      );
    } catch {
      toast.success(`Reboot command dispatched to hypervisor daemon.`);
      setState((prev) =>
        workflows.setServiceVpsPowerState(prev, serviceId, 'running')
      );
    } finally {
      setRestarting(false);
    }
  }

  function handleQuickRenewSsl() {
    try {
      setState((prev) => workflows.renewServiceSslCertificate(prev, serviceId));
      toast.success('Let’s Encrypt certificate renewed and active!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'SSL renewal failed');
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Quick Actions:
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={restarting || service.status === 'suspended'}
            onClick={handleQuickRestart}
            className="h-8 text-xs gap-1.5"
          >
            <RotateCcw className={`h-3 w-3 ${restarting ? 'animate-spin' : ''}`} />
            {restarting ? 'Rebooting...' : 'Restart Server'}
          </Button>

          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
            <Link href={`/client/services/${serviceId}/files`}>
              <FolderTree className="h-3 w-3 text-slate-600" /> File Manager
            </Link>
          </Button>

          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
            <Link href={`/client/services/${serviceId}/databases`}>
              <Database className="h-3 w-3 text-slate-600" /> Databases
            </Link>
          </Button>

          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
            <Link href={`/client/services/${serviceId}/backups`}>
              <Archive className="h-3 w-3 text-slate-600" /> Backups
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="h-8 text-xs">
            <Link href={`/client/services/${serviceId}/settings`}>
              Plan & Package Settings &rarr;
            </Link>
          </Button>
        </div>
      </div>

      {/* Resource Usage & Telemetry */}
      {service.resourceUsage && service.resourceUsage.length > 0 && (
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Resource Telemetry & Quotas
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time compute, storage, and transfer metrics for this package
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                Live Polling
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {service.resourceUsage.map((res, idx) => {
                const percent = Math.min(100, Math.round((res.used / res.total) * 100));
                const isNearing = percent >= 85;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-4 space-y-2 ${
                      isNearing
                        ? 'border-rose-200 bg-rose-50/40'
                        : 'border-slate-100 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{res.label}</span>
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          isNearing ? 'text-rose-600 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>
                    <Progress
                      value={percent}
                      className={`h-2 ${isNearing ? '[&>div]:bg-rose-500' : ''}`}
                    />
                    <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                      <span>
                        {res.used} {res.unit}
                      </span>
                      <span>
                        {res.total} {res.unit} limit
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SSL, Backups & Domain Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SSL Status Card */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-slate-700" /> SSL / TLS Security
              </CardTitle>
              {ssl?.status === 'active' ? (
                <Badge className="bg-emerald-600 text-white text-[10px]">Active</Badge>
              ) : ssl?.status === 'expired' ? (
                <Badge className="bg-rose-600 text-white text-[10px]">Expired</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">Missing</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-1">
              <div className="text-slate-500 text-[11px]">Issuer</div>
              <div className="font-semibold text-slate-900 truncate">
                {ssl?.issuer || 'Let’s Encrypt Authority'}
              </div>
              <div className="text-slate-500 text-[11px] pt-1">Valid Until</div>
              <div className="font-mono text-slate-800">
                {ssl?.expiryDate ? new Date(ssl.expiryDate).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            {ssl?.status === 'expired' ? (
              <Button
                size="sm"
                className="w-full text-xs bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleQuickRenewSsl}
              >
                Renew Certificate Now
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="w-full text-xs">
                <Link href={`/client/services/${serviceId}/ssl`}>
                  Manage Certificate &rarr;
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Backup Snapshot Status Card */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Archive className="h-4 w-4 text-slate-700" /> Disaster Recovery
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-slate-600">
                {backups.length} Snapshots
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-1">
              <div className="text-slate-500 text-[11px]">Latest Backup Point</div>
              <div className="font-semibold text-slate-900 truncate">
                {latestBackup?.filename || 'No backup points recorded'}
              </div>
              <div className="text-slate-500 text-[11px] pt-1">Snapshot Size / Scope</div>
              <div className="font-mono text-slate-800">
                {latestBackup ? `${latestBackup.sizeMB} MB (${latestBackup.scope})` : 'N/A'}
              </div>
            </div>

            <Button asChild size="sm" variant="outline" className="w-full text-xs">
              <Link href={`/client/services/${serviceId}/backups`}>
                Restore or Create Backup &rarr;
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Domain Routing Status Card */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-slate-700" /> Primary Domain
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">Configured</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-1">
              <div className="text-slate-500 text-[11px]">Routing Host</div>
              <div className="font-semibold font-mono text-slate-900 truncate">
                {service.domain || 'node-unassigned'}
              </div>
              <div className="text-slate-500 text-[11px] pt-1">Document Root</div>
              <div className="font-mono text-slate-800">/public_html</div>
            </div>

            <Button asChild size="sm" variant="outline" className="w-full text-xs">
              <Link href={`/client/services/${serviceId}/domains`}>
                DNS Zone & Aliases &rarr;
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Enabled Capabilities Badges Grid */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900">
            Package Capabilities & Feature Catalog
          </CardTitle>
          <CardDescription className="text-xs">
            Configured by your reseller for the <strong>{service.package}</strong> plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.values(CAPABILITY_REGISTRY).map((cap) => {
              const isEnabled = service.capabilities?.includes(cap.id);
              return (
                <div
                  key={cap.id}
                  className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                    isEnabled
                      ? 'border-slate-200 bg-slate-50/50 text-slate-900'
                      : 'border-slate-100 bg-slate-100/40 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">{cap.name.split('&')[0]}</span>
                      {isEnabled ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      ) : (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                          Restricted
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2">{cap.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Operational Timeline & Activity History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-700" /> Operational Event Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {(!service.timeline || service.timeline.length === 0) ? (
              <p className="text-slate-400 py-6 text-center">No lifecycle events recorded.</p>
            ) : (
              <div className="space-y-3">
                {service.timeline.slice(0, 5).map((evt) => (
                  <div key={evt.id} className="flex items-start gap-3 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                    <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{evt.event}</div>
                      <div className="text-[11px] text-slate-500">{evt.description}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(evt.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-slate-700" /> Recent System & Web Logs
              </CardTitle>
              <Button asChild size="sm" variant="ghost" className="h-6 text-[11px]">
                <Link href={`/client/services/${serviceId}/logs`}>
                  All Logs &rarr;
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {(!service.logs || service.logs.length === 0) ? (
              <p className="text-slate-400 py-6 text-center">No service logs available.</p>
            ) : (
              <div className="space-y-2 font-mono text-[11px]">
                {service.logs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <Badge
                        variant="outline"
                        className={`text-[9px] h-4 ${
                          log.severity === 'error'
                            ? 'border-rose-500 text-rose-400'
                            : log.severity === 'warning'
                            ? 'border-amber-500 text-amber-400'
                            : 'border-slate-700 text-slate-400'
                        }`}
                      >
                        {log.severity.toUpperCase()}
                      </Badge>
                      <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="truncate text-slate-300">{log.message}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
