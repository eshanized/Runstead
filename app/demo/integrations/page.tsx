'use client';

import { useState } from 'react';
import { Plug, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Lock } from 'lucide-react';
import { DemoShell } from '@/components/demo/demo-shell';
import { DemoPageHeader, DemoEmptyState } from '@/components/demo/demo-helpers';
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
    <DemoShell>
      <IntegrationsContent />
    </DemoShell>
  );
}

function IntegrationsContent() {
  const { state, setState } = useDemo();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selected, setSelected] = useState<Integration | null>(null);

  const categories = Array.from(new Set(state.integrations.map((i) => i.category)));
  const filtered = getFilteredIntegrations(state.integrations, categoryFilter);

  function testConnection(integration: Integration) {
    const statuses: IntegrationStatus[] = integration.status === 'unavailable' ? ['unavailable'] : ['connected', 'degraded', 'disconnected'];
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const updated: Integration = { ...integration, status: newStatus, lastTested: new Date().toISOString() };
    setState((prev) => ({ ...prev, integrations: prev.integrations.map((i) => i.id === integration.id ? updated : i) }));
    setSelected(updated);
    if (newStatus === 'connected') toast.success(`Connection to ${integration.name} successful`);
    else if (newStatus === 'degraded') toast.warning(`Connection to ${integration.name} is degraded`);
    else toast.error(`Connection to ${integration.name} failed`);
  }

  function toggleConnection(integration: Integration) {
    if (integration.status === 'unavailable') {
      toast.error(`${integration.name} is not available for connection`);
      return;
    }
    const newStatus: IntegrationStatus = integration.status === 'connected' ? 'disconnected' : 'connected';
    const updated: Integration = { ...integration, status: newStatus, lastTested: newStatus === 'connected' ? new Date().toISOString() : integration.lastTested };
    setState((prev) => ({ ...prev, integrations: prev.integrations.map((i) => i.id === integration.id ? updated : i) }));
    setSelected(updated);
    toast.success(`${integration.name} ${newStatus === 'connected' ? 'connected' : 'disconnected'}`);
  }

  return (
    <>
      <DemoPageHeader title="Integrations" description={`${state.integrations.length} provider integrations`} />

      <Alert className="mb-4">
        <Lock className="h-4 w-4" />
        <AlertTitle>Demo integrations</AlertTitle>
        <AlertDescription>
          All integration statuses are simulated. No real provider credentials are collected or stored.
          Never enter real API keys, passwords, or private keys in this demo.
        </AlertDescription>
      </Alert>

      <div className="mb-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <DemoEmptyState icon={Plug} title="No integrations found" />
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
                    <Icon className={`h-5 w-5 ${int.status === 'connected' ? 'text-success' : int.status === 'degraded' ? 'text-warning' : int.status === 'unavailable' ? 'text-muted-foreground' : 'text-muted-foreground/40'}`} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{int.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {int.capabilities.slice(0, 3).map((c) => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge status={int.status} />
                    <Button variant="outline" size="sm" onClick={() => setSelected(int)}>Configure</Button>
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
              <DialogTitle>{selected.name}</DialogTitle>
              <DialogDescription>{selected.category} - {selected.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.status} />
                {selected.lastTested && <span className="text-xs text-muted-foreground">Last tested: {formatDateTime(selected.lastTested)}</span>}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Capabilities</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selected.capabilities.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
                </div>
              </div>
              {selected.config.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Configuration</h4>
                  <div className="space-y-3">
                    {selected.config.map((c) => (
                      <div key={c.key} className="space-y-1">
                        <Label className="text-xs">{c.label}</Label>
                        <Input value={c.value} readOnly type={c.masked ? 'password' : 'text'} placeholder="Demo only - do not enter real credentials" />
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">This is a demo. Do not enter real API keys or passwords.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => testConnection(selected)}><RefreshCw className="mr-2 h-4 w-4" /> Test Connection</Button>
              <Button onClick={() => toggleConnection(selected)} disabled={selected.status === 'unavailable'}>
                {selected.status === 'connected' ? 'Disconnect' : 'Connect'}
              </Button>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
