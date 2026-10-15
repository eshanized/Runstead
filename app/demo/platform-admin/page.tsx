'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Server,
  DollarSign,
  Users,
  Activity,
  Layers,
  Shield,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  Eye,
  Settings2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import { getPlatformStats, formatCurrency, relativeTime, formatDate } from '@/lib/demo/selectors';
import type { PlatformTenant, TenantStatus } from '@/lib/demo/types';
import { pricingPlans } from '@/lib/config/pricing';
import { siteConfig } from '@/lib/config/site';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function PlatformAdminPage() {
  const { state, setState, resetDemo } = useDemo();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenant | null>(null);
  const [newPlan, setNewPlan] = useState('');
  const [newStatus, setNewStatus] = useState<TenantStatus>('active');

  const platformStats = getPlatformStats(state);

  const filteredTenants = useMemo(() => {
    let list = state.platformOperator?.tenants || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.businessName.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          t.contactEmail.toLowerCase().includes(q)
      );
    }
    if (planFilter !== 'all') {
      list = list.filter((t) => t.plan.toLowerCase() === planFilter.toLowerCase());
    }
    if (statusFilter !== 'all') {
      list = list.filter((t) => t.status === statusFilter);
    }
    return list;
  }, [state.platformOperator?.tenants, search, planFilter, statusFilter]);

  function handleOpenTenant(tenant: PlatformTenant) {
    setSelectedTenant(tenant);
    setNewPlan(tenant.plan);
    setNewStatus(tenant.status);
  }

  function handleSaveTenantChanges() {
    if (!selectedTenant) return;

    try {
      let nextState = state;
      if (newStatus !== selectedTenant.status) {
        nextState = workflows.updatePlatformTenantStatus(nextState, {
          tenantId: selectedTenant.id,
          status: newStatus,
        });
      }
      if (newPlan !== selectedTenant.plan) {
        nextState = workflows.updatePlatformTenantPlan(nextState, {
          tenantId: selectedTenant.id,
          plan: newPlan,
        });
      }

      setState(() => nextState);
      toast.success(`Platform tenant "${selectedTenant.businessName}" updated.`);
      setSelectedTenant(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update tenant');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Platform Operator Master Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-3.5 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">Tonmoy Cloud Operator</span>
              <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-[11px]">
                Platform Admin
              </Badge>
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[11px]">
                Simulated Data
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Runstead SaaS Infrastructure & Reseller Tenant Fleet Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={resetDemo}
            className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset Demo
          </Button>

          <Button
            size="sm"
            asChild
            className="bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
          >
            <Link href="/demo/overview">
              Switch to Reseller Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Investor Context Notice */}
        <div className="rounded-xl border border-indigo-950/70 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 p-4 text-xs text-slate-300 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-indigo-300 text-sm">Investor Demonstration View:</span>
              <p className="mt-1 leading-relaxed text-slate-400">
                This console illustrates how Tonmoy Infrastructure manages the multi-tenant SaaS itself. The figures below
                represent simulated platform ARR, tenant subscription distribution, and driver health across all reseller accounts.
                All figures are illustrative demo fixtures.
              </p>
            </div>
          </div>
          <Link href="/demo/launch" className="shrink-0 text-indigo-400 hover:text-indigo-300 font-medium underline flex items-center gap-1">
            Simulate New Reseller Launch <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {/* Global Platform KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Platform MRR (SaaS Subscriptions)</span>
                <DollarSign className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-white">
                {formatCurrency(platformStats.totalMrr)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Annualized ARR: {formatCurrency(platformStats.totalArr)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Total Reseller Tenants</span>
                <Building2 className="h-4 w-4 text-sky-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-white">
                {platformStats.totalTenants}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                <span className="text-emerald-400 font-medium">{platformStats.activeTenants} Active</span>
                {' · '}
                <span>{platformStats.totalTenants - platformStats.activeTenants} Trial / Suspended</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Average MRR Per Tenant</span>
                <Users className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-white">
                {formatCurrency(platformStats.avgMrrPerTenant)}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Across {platformStats.activeTenants} paying business accounts
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Platform Provisioning Drivers</span>
                <Server className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-white">
                {state.platformOperator?.integrations.filter((i) => i.status === 'operational').length} /{' '}
                {state.platformOperator?.integrations.length} Operational
              </div>
              <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> cPanel, Plesk, PowerDNS, Registrar
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Views: Tenants, Drivers, Plan Distribution, Audit Log */}
        <Tabs defaultValue="tenants" className="space-y-4">
          <TabsList className="bg-slate-900 border border-slate-800 p-1">
            <TabsTrigger value="tenants" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Building2 className="mr-1.5 h-4 w-4" /> Reseller Tenants Directory
            </TabsTrigger>
            <TabsTrigger value="drivers" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Server className="mr-1.5 h-4 w-4" /> Driver & Hypervisor Clusters
            </TabsTrigger>
            <TabsTrigger value="distribution" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Activity className="mr-1.5 h-4 w-4" /> Subscription Distribution
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Layers className="mr-1.5 h-4 w-4" /> Platform Event Stream
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Tenants Directory */}
          <TabsContent value="tenants" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Filter by business name, slug, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex gap-2">
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-[140px] bg-slate-900 border-slate-800 text-slate-300">
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="Sandbox">Sandbox</SelectItem>
                    <SelectItem value="Launch">Launch</SelectItem>
                    <SelectItem value="Growth">Growth</SelectItem>
                    <SelectItem value="Scale">Scale</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] bg-slate-900 border-slate-800 text-slate-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="bg-slate-900/70 border-slate-800">
              <Table>
                <TableHeader className="bg-slate-900/90 border-slate-800">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Business / Tenant</TableHead>
                    <TableHead className="text-slate-400">Category</TableHead>
                    <TableHead className="text-slate-400">SaaS Plan</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Platform MRR</TableHead>
                    <TableHead className="text-slate-400">Customers / Limit</TableHead>
                    <TableHead className="text-slate-400">Created</TableHead>
                    <TableHead className="text-right text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((t) => (
                    <TableRow key={t.id} className="border-slate-800 hover:bg-slate-800/40">
                      <TableCell>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {t.businessName}
                          {t.id === 'ten_001' && (
                            <Badge className="bg-indigo-600/30 text-indigo-300 border-indigo-500/40 text-[10px] py-0">
                              Active Demo Session
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{t.slug}.runstead.demo</div>
                      </TableCell>
                      <TableCell className="capitalize text-slate-300 text-xs">{t.category}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-slate-800 text-slate-200 border-slate-700"
                        >
                          {t.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {t.status === 'active' && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            Active
                          </Badge>
                        )}
                        {t.status === 'trial' && (
                          <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30">
                            Trial
                          </Badge>
                        )}
                        {t.status === 'suspended' && (
                          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30">
                            Suspended
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-200">
                        {formatCurrency(t.mrr)}
                        <span className="text-[11px] text-slate-500">/{t.billingInterval === 'annually' ? 'mo (yr)' : 'mo'}</span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-300">
                        {t.customerCount} / {t.customerLimit}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {formatDate(t.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenTenant(t)}
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-slate-800"
                        >
                          Manage <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Tab 2: Drivers & Clusters */}
          <TabsContent value="drivers" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {state.platformOperator?.integrations.map((driver) => (
                <Card key={driver.id} className="bg-slate-900/70 border-slate-800 text-slate-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-white">{driver.name}</CardTitle>
                      {driver.status === 'operational' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          Operational
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30">
                          Maintenance
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs text-slate-400 font-mono">
                      Type: {driver.type}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0 text-xs">
                    <div className="flex justify-between border-t border-slate-800 pt-2">
                      <span className="text-slate-400">Connected Resellers</span>
                      <span className="font-semibold text-white">{driver.connectedTenantsCount} Tenants</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Internal Latency</span>
                      <span className="font-mono text-emerald-400">{driver.latencyMs} ms</span>
                    </div>
                    <div className="rounded border border-slate-800 bg-slate-950/60 p-2 text-slate-400 text-[11px]">
                      Automated health probe verified cluster heartbeat at 2026-10-14T12:00:00Z.
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab 3: Subscription Distribution */}
          <TabsContent value="distribution" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
                <CardHeader>
                  <CardTitle className="text-base text-white">Tenant Plan Distribution</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Breakdown of registered reseller businesses by active subscription tier.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {platformStats.planDistribution.map((item) => (
                    <div key={item.plan} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-300">{item.plan} Tier</span>
                        <span className="text-slate-400">{item.count} tenants</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{
                            width: `${(item.count / Math.max(1, platformStats.totalTenants)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
                <CardHeader>
                  <CardTitle className="text-base text-white">SaaS Feature Entitlements</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Enforced tier limitations and platform capabilities per reseller contract.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {pricingPlans.map((p) => (
                    <div key={p.name} className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <span className="font-semibold text-white">{p.name}</span>
                        <div className="text-[11px] text-slate-400">{p.suitableFor}</div>
                      </div>
                      <Badge variant="outline" className="border-slate-700 text-slate-300">
                        {p.limits.find((l) => l.label === 'Customers')?.value} Accounts
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 4: Platform Audit Event Stream */}
          <TabsContent value="audit" className="space-y-4">
            <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base text-white">Platform Audit Log</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Global billing, subscription, and tenant operational telemetry.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {state.platformOperator?.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start justify-between border-b border-slate-800/80 pb-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{ev.tenantName}</span>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] py-0 ${
                              ev.severity === 'warning'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {ev.type.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-slate-400">{ev.description}</p>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                        {relativeTime(ev.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Tenant Management Modal */}
      {selectedTenant && (
        <Dialog open onOpenChange={() => setSelectedTenant(null)}>
          <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-lg text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-400" /> Manage {selectedTenant.businessName}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Simulate platform-level subscription changes and operational state overrides.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tenant Identifier:</span>
                  <span className="font-mono text-slate-200">{selectedTenant.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slug:</span>
                  <span className="font-mono text-slate-200">{selectedTenant.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">End-Customer Accounts:</span>
                  <span className="font-medium text-slate-200">
                    {selectedTenant.customerCount} / {selectedTenant.customerLimit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Services:</span>
                  <span className="font-medium text-slate-200">{selectedTenant.serviceCount}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Tenant Subscription Tier</label>
                <Select value={newPlan} onValueChange={setNewPlan}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    {pricingPlans.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name} Tier ({p.monthlyPrice === null ? 'Custom' : p.monthlyPrice === 0 ? 'Free' : `$${p.monthlyPrice}/mo`})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Tenant Fleet Status</label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as TenantStatus)}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="active">Active (Full platform operations)</SelectItem>
                    <SelectItem value="trial">Trial (Evaluation limits apply)</SelectItem>
                    <SelectItem value="suspended">Suspended (Platform access locked)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedTenant.id === 'ten_001' && (
                <div className="rounded-lg border border-indigo-900/60 bg-indigo-950/20 p-2.5 text-xs text-indigo-300 flex items-center justify-between">
                  <span>This tenant matches your current active demo session.</span>
                  <Button size="sm" variant="ghost" asChild className="h-7 text-xs text-indigo-200 hover:text-white">
                    <Link href="/demo/overview">Go to Dashboard</Link>
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setSelectedTenant(null)}
                className="border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTenantChanges}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Save Changes (Simulated)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
