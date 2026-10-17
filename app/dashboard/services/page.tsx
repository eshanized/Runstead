'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Server, Eye, Pause, Play, XCircle, ArrowUpCircle, ExternalLink, HardDrive } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardPageHeader, DashboardEmptyState } from '@/components/dashboard/dashboard-helpers';
import { useDemo } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import { searchServices, filterServicesByStatus, formatCurrency, formatDate, formatDateTime } from '@/lib/demo/selectors';
import type { Service, ServiceStatus } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/shared/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

export default function ServicesPage() {
  return (
    <DashboardShell>
      <ServicesContent />
    </DashboardShell>
  );
}

function ServicesContent() {
  const { state, setState, syncFromServer } = useDemo();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [targetProductId, setTargetProductId] = useState('');

  const selectedService = useMemo(() => {
    return state.services.find((s) => s.id === selectedServiceId) ?? null;
  }, [state.services, selectedServiceId]);

  const filtered = useMemo(() => {
    let result = searchServices(state.services, search);
    result = filterServicesByStatus(result, statusFilter);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.services, search, statusFilter]);

  async function handleSuspend(service: Service) {
    try {
      const res = await fetch(`/api/reseller/services/${service.id}/actions?tenantId=default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend', reason: 'Administrative suspension' }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to suspend service');

      await syncFromServer();
      toast.success(`Service ${service.serviceName} suspended on infrastructure.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to suspend service');
    }
  }

  async function handleRestore(service: Service) {
    try {
      const res = await fetch(`/api/reseller/services/${service.id}/actions?tenantId=default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsuspend' }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to restore service');

      await syncFromServer();
      toast.success(`Service ${service.serviceName} restored and active on infrastructure.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to restore service');
    }
  }

  async function handleCancel(service: Service) {
    if (!confirm(`Cancel service "${service.serviceName}"? This action will set status to canceled.`)) return;
    try {
      const res = await fetch(`/api/reseller/services/${service.id}/actions?tenantId=default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'terminate', reason: 'User requested cancellation' }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to cancel service');

      await syncFromServer();
      toast.success(`Service ${service.serviceName} canceled on infrastructure.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel service');
    }
  }

  function handleUpgrade() {
    if (!selectedService || !targetProductId) return;
    try {
      setState((prev) => workflows.upgradeService(prev, { serviceId: selectedService.id, newProductId: targetProductId }));
      setUpgradeDialogOpen(false);
      toast.success(`Service successfully upgraded to new package`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to upgrade service');
    }
  }

  return (
    <>
      <DashboardPageHeader title="Services" description={`${state.services.length} active hosting services across cluster fleet`} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search services by domain or package..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <DashboardEmptyState icon={Server} title="No services found" description="Try adjusting your search or filters." />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service / Hostname</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Renewal</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{s.productName}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {s.domain ?? s.serverHostname ?? 'No domain attached'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/customers?search=${encodeURIComponent(s.customerName)}`} className="hover:underline flex items-center gap-1">
                      {s.customerName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.package}</TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(s.nextRenewalDate)}</TableCell>
                  <TableCell>{formatCurrency(s.price, state.business.currency)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedServiceId(s.id)} aria-label={`View details for ${s.serviceName}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {selectedService && (
        <Dialog open onOpenChange={(open) => { if (!open) setSelectedServiceId(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-accent" />
                {selectedService.productName}
              </DialogTitle>
              <DialogDescription>
                {selectedService.serviceName} &bull; {selectedService.customerName}
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="usage">Resource Usage</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 bg-muted/20">
                  <div>
                    <span className="text-xs text-muted-foreground">Status</span>
                    <div className="mt-0.5"><StatusBadge status={selectedService.status} /></div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Package</span>
                    <div className="text-sm font-medium">{selectedService.package}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Domain / Host</span>
                    <div className="text-sm font-medium font-mono">{selectedService.domain ?? 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Dedicated IP</span>
                    <div className="text-sm font-medium font-mono">{selectedService.ipAddress ?? '198.51.100.42'}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Billing Cycle</span>
                    <div className="text-sm font-medium capitalize">{selectedService.billingCycle.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Renewal Price</span>
                    <div className="text-sm font-medium">{formatCurrency(selectedService.price, state.business.currency)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Next Renewal Date</span>
                    <div className="text-sm font-medium">{formatDate(selectedService.nextRenewalDate)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Server Hostname</span>
                    <div className="text-sm font-medium font-mono">{selectedService.serverHostname ?? 'node-01.ord.runstead.io'}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                  {selectedService.orderId && (
                    <Link href="/dashboard/orders" className="text-accent hover:underline flex items-center gap-1 border rounded px-2 py-1">
                      Originating Order: {selectedService.orderId} <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  {selectedService.domain && (
                    <Link href={`/dashboard/dns`} className="text-accent hover:underline flex items-center gap-1 border rounded px-2 py-1">
                      Manage DNS Zone <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="usage" className="space-y-3 pt-2">
                {selectedService.resourceUsage.map((r) => {
                  const pct = Math.min(100, Math.round((r.used / (r.total || 1)) * 100));
                  return (
                    <div key={r.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{r.label}</span>
                        <span className="text-muted-foreground font-mono">{r.used} / {r.total} {r.unit} ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
                {selectedService.resourceUsage.length > 0 && (
                  <ChartContainer config={{ used: { label: 'Used', color: 'hsl(var(--chart-1))' } }} className="h-[180px] w-full mt-4">
                    <BarChart data={selectedService.resourceUsage.map((r) => ({ name: r.label, used: r.used, total: r.total }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="used" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
                <p className="text-xs text-muted-foreground">Real-time resource utilization telemetry reported by hypervisor node agents.</p>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-2 pt-2">
                {selectedService.timeline.map((t) => (
                  <div key={t.id} className="flex items-start gap-3 rounded-lg border p-2.5">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t.event}</div>
                      <div className="text-xs text-muted-foreground">{t.description}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{formatDateTime(t.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex-wrap gap-2 sm:justify-between">
              <div className="flex items-center gap-2">
                {selectedService.status === 'active' && (
                  <Button variant="outline" size="sm" onClick={() => handleSuspend(selectedService)}>
                    <Pause className="mr-1.5 h-3.5 w-3.5" /> Suspend
                  </Button>
                )}
                {selectedService.status === 'suspended' && (
                  <Button variant="outline" size="sm" onClick={() => handleRestore(selectedService)}>
                    <Play className="mr-1.5 h-3.5 w-3.5" /> Restore
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setUpgradeDialogOpen(true)}>
                  <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" /> Upgrade Plan
                </Button>
                {selectedService.status !== 'canceled' && (
                  <Button variant="destructive" size="sm" onClick={() => handleCancel(selectedService)}>
                    <XCircle className="mr-1.5 h-3.5 w-3.5" /> Cancel
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedServiceId(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Upgrade Package Dialog */}
      {selectedService && upgradeDialogOpen && (
        <Dialog open onOpenChange={setUpgradeDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upgrade Service Plan</DialogTitle>
              <DialogDescription>
                Select a higher tier package for {selectedService.domain || selectedService.productName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="text-sm text-muted-foreground">
                Current Plan: <span className="font-semibold text-foreground">{selectedService.package}</span> ({formatCurrency(selectedService.price, state.business.currency)}/{selectedService.billingCycle})
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Target Product</label>
                <Select value={targetProductId} onValueChange={setTargetProductId}>
                  <SelectTrigger><SelectValue placeholder="Choose upgraded product" /></SelectTrigger>
                  <SelectContent>
                    {state.products
                      .filter((p) => p.id !== selectedService.productId)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - {formatCurrency(p.pricing[0]?.price ?? 0, state.business.currency)}/mo
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpgrade} disabled={!targetProductId}>Confirm Upgrade</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
