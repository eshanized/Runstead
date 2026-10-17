'use client';

import { useState } from 'react';
import { Plug, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Lock, ShieldCheck, Zap } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardPageHeader, DashboardEmptyState } from '@/components/dashboard/dashboard-helpers';
import { useDemo } from '@/lib/demo/store';
import { getFilteredIntegrations, formatDateTime } from '@/lib/demo/selectors';
import type { Integration, IntegrationStatus } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

const statusIcons: Record<IntegrationStatus, React.ComponentType<{ className?: string }>> = {
  connected: CheckCircle2,
  disconnected: XCircle,
  degraded: AlertTriangle,
  unavailable: Lock,
};

export default function IntegrationsDemoPage() {
  return (
    <DashboardShell>
      <IntegrationsContent />
    </DashboardShell>
  );
}

function IntegrationsContent() {
  const { state, setState } = useDemo();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selected, setSelected] = useState<Integration | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const categories = Array.from(new Set(state.integrations.map((i) => i.category)));
  const filtered = getFilteredIntegrations(state.integrations, categoryFilter);

  async function testConnection(integration: Integration) {
    if (integration.status === 'unavailable') {
      toast.error(`${integration.name} module requires an active license key to activate.`);
      return;
    }

    setTestingId(integration.id);

    try {
      const res = await fetch('/api/health');
      await res.json();
      setTestingId(null);

      const isConnected = integration.status === 'connected';
      const updated: Integration = {
        ...integration,
        lastTested: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        integrations: prev.integrations.map((i) => (i.id === integration.id ? updated : i)),
      }));

      setSelected(updated);
      if (isConnected) {
        toast.success(`Verified gateway connectivity to ${integration.name}. Health check passed.`);
      } else {
        toast.info(`${integration.name} is currently in standby. Provide live credentials in settings to activate.`);
      }
    } catch {
      setTestingId(null);
      toast.error(`Endpoint verification failed for ${integration.name}.`);
    }
  }

  function toggleConnection(integration: Integration) {
    if (integration.status === 'unavailable') {
      toast.error(`${integration.name} is not available for connection.`);
      return;
    }
    const newStatus: IntegrationStatus = integration.status === 'connected' ? 'disconnected' : 'connected';
    const updated: Integration = {
      ...integration,
      status: newStatus,
      lastTested: newStatus === 'connected' ? new Date().toISOString() : integration.lastTested,
    };
    setState((prev) => ({
      ...prev,
      integrations: prev.integrations.map((i) => (i.id === integration.id ? updated : i)),
    }));
    setSelected(updated);
    toast.success(`${integration.name} ${newStatus === 'connected' ? 'connected and authenticated' : 'disconnected'}.`);
  }

  return (
    <>
      <DashboardPageHeader title="Integrations" description={`${state.integrations.length} provider integrations`} />

      <Alert className="mb-4 bg-blue-50/70 border-blue-200 text-blue-900">
        <Lock className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-950 font-bold">Simulated Provider Integrations</AlertTitle>
        <AlertDescription className="text-blue-800 text-xs">
          All external provider connections (Stripe, cPanel, Proxmox, AWS Route 53, SendGrid) operate in simulated mode with
          deterministic health checks. No real credit card or cloud API credentials are ever required or stored.
        </AlertDescription>
      </Alert>

      <div className="mb-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <DashboardEmptyState icon={Plug} title="No integrations found" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((int) => {
            const Icon = statusIcons[int.status];
            return (
              <Card key={int.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{int.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{int.category}</p>
                    </div>
                    <Icon
                      className={`h-5 w-5 ${
                        int.status === 'connected'
                          ? 'text-emerald-600'
                          : int.status === 'degraded'
                            ? 'text-amber-500'
                            : int.status === 'unavailable'
                              ? 'text-slate-400'
                              : 'text-slate-300'
                      }`}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{int.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {int.capabilities.slice(0, 3).map((c) => (
                      <Badge key={c} variant="outline" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-3 border-t">
                    <StatusBadge status={int.status} />
                    <Button variant="outline" size="sm" onClick={() => setSelected(int)}>
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-indigo-600" />
                {selected.name}
              </DialogTitle>
              <DialogDescription>
                {selected.category} — {selected.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Live Status:</span>
                  <StatusBadge status={selected.status} />
                </div>
                {selected.lastTested && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Last tested: {formatDateTime(selected.lastTested)}
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Supported Capabilities
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selected.capabilities.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>

              {selected.config.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    API Parameters & Simulated Credentials
                  </h4>
                  <div className="space-y-2.5">
                    {selected.config.map((c) => (
                      <div key={c.key} className="space-y-1">
                        <Label className="text-xs text-slate-600">{c.label}</Label>
                        <Input
                          value={c.value}
                          readOnly
                          type={c.masked ? 'password' : 'text'}
                          className="font-mono text-xs bg-slate-50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-wrap gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                disabled={testingId === selected.id}
                onClick={() => testConnection(selected)}
              >
                <RefreshCw className={`mr-2 h-3.5 w-3.5 ${testingId === selected.id ? 'animate-spin' : ''}`} />
                {testingId === selected.id ? 'Testing...' : 'Test Handshake'}
              </Button>
              <Button
                size="sm"
                onClick={() => toggleConnection(selected)}
                disabled={selected.status === 'unavailable'}
                className={selected.status === 'connected' ? 'bg-slate-700' : 'bg-blue-600'}
              >
                {selected.status === 'connected' ? 'Disconnect' : 'Connect'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
