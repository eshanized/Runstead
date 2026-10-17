'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDemo } from '@/lib/demo/store';
import { updateServiceHostname } from '@/lib/demo/workflows';
import { formatCurrency } from '@/lib/demo/selectors';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Settings,
  Server,
  ArrowUpRight,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params?.serviceId as string;
  const { state, setState } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);

  // Hostname state
  const [hostnameInput, setHostnameInput] = useState(service?.serverHostname || '');

  // Upgrade state
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(service?.productId || '');

  // Cancellation state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Project completed');
  const [cancelConfirmText, setCancelConfirmText] = useState('');

  if (!service) {
    return <div className="p-8 text-center text-slate-500">Service not found.</div>;
  }

  function handleSaveHostname() {
    if (!hostnameInput.trim()) {
      toast.error('Hostname cannot be empty.');
      return;
    }
    try {
      const nextState = updateServiceHostname(state, service!.id, hostnameInput.trim());
      setState(nextState);
      toast.success(`Server hostname updated to ${hostnameInput.trim()}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error updating hostname');
    }
  }

  function handleExecutePlanChange() {
    const targetProduct = state.products.find((p) => p.id === selectedProductId);
    if (!targetProduct) return;

    const nextServices = state.services.map((s) => {
      if (s.id === service!.id) {
        return {
          ...s,
          productId: targetProduct.id,
          productName: targetProduct.name,
          price: targetProduct.priceMonthly ?? s.price,
          capabilities: targetProduct.capabilities || s.capabilities,
          planLimits: targetProduct.planLimits || s.planLimits,
          timeline: [
            {
              id: `tl_${Date.now()}`,
              event: 'Plan Upgraded',
              description: `Migrated to ${targetProduct.name} ($${targetProduct.priceMonthly}/mo)`,
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
              message: `Service plan upgraded to: ${targetProduct.name}`,
            },
            ...(s.logs || []),
          ],
        };
      }
      return s;
    });

    setState({ ...state, services: nextServices });
    toast.success(`Plan successfully updated to ${targetProduct.name}! Quotas updated.`);
    setUpgradeDialogOpen(false);
  }

  function handleConfirmCancel() {
    if (cancelConfirmText !== service!.domain) {
      toast.error(`Please type "${service!.domain}" to confirm cancellation.`);
      return;
    }

    const nextServices = state.services.map((s) => {
      if (s.id === service!.id) {
        return {
          ...s,
          status: 'suspended' as const,
          timeline: [
            {
              id: `tl_${Date.now()}`,
              event: 'Service Cancellation Requested',
              description: `Reason: ${cancelReason}`,
              timestamp: new Date().toISOString(),
            },
            ...s.timeline,
          ],
          logs: [
            {
              id: `lg_${Date.now()}`,
              timestamp: new Date().toISOString(),
              severity: 'warning' as const,
              category: 'system' as const,
              message: `Cancellation requested: ${cancelReason}`,
            },
            ...(s.logs || []),
          ],
        };
      }
      return s;
    });

    setState({ ...state, services: nextServices });
    toast.success(`Service ${service!.domain} marked as suspended for cancellation.`);
    setCancelDialogOpen(false);
    router.push('/client/services');
  }

  const otherProducts = state.products.filter((p) => p.id !== service.productId);
  const selectedProduct = state.products.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-8">
      {/* Hostname & Node Routing */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Server className="h-5 w-5 text-indigo-600" />
            Server Hostname & Hypervisor Node Assignment
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Configure internal fully qualified domain name (FQDN) resolved on cluster bridge.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-semibold text-slate-700">Fully Qualified Hostname (FQDN)</label>
              <Input
                value={hostnameInput}
                onChange={(e) => setHostnameInput(e.target.value)}
                placeholder="node1.runstead.tonmoyinfrastructure.org"
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400">
                Must resolve to server IP address ({service.ipAddress || '198.51.100.50'}).
              </p>
            </div>

            <div className="flex items-end">
              <Button size="sm" onClick={handleSaveHostname} className="bg-slate-900 hover:bg-slate-800 text-white text-xs">
                Save Hostname
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Tier & Plan Management */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-blue-600" />
                Subscription Plan & Resource Tier
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Current package: <strong className="text-slate-800">{service.productName}</strong> ({formatCurrency(service.price)}/{service.billingCycle})
              </CardDescription>
            </div>

            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
              onClick={() => setUpgradeDialogOpen(true)}
            >
              Change / Upgrade Plan
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 font-mono">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                Billing Cycle
              </span>
              <span className="text-slate-900 font-bold text-xs mt-0.5 block capitalize">
                {service.billingCycle}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                Next Renewal Date
              </span>
              <span className="text-slate-900 font-bold text-xs mt-0.5 block">
                {service.nextRenewalDate ? new Date(service.nextRenewalDate).toLocaleDateString() : 'Active'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                Auto-Renew
              </span>
              <span className="text-emerald-700 font-bold text-xs mt-0.5 block">
                Enabled (Recurring Charge)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border border-rose-200 bg-rose-50/40 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-rose-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-xs text-rose-700">
            Irreversible operations affecting live service availability and data retention.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-rose-200">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900">Request Service Cancellation</div>
              <p className="text-slate-500 text-[11px]">
                Initiate account termination, release IP assignment, and schedule automated filesystem deprovisioning.
              </p>
            </div>

            <Button
              size="sm"
              variant="destructive"
              className="text-xs shrink-0"
              onClick={() => setCancelDialogOpen(true)}
            >
              Cancel Service
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Plan Wizard Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Change Hosting Plan</DialogTitle>
            <DialogDescription className="text-xs">
              Select a target tier. Upgrades apply immediately and adjust resource limits without migration downtime.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {otherProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => setSelectedProductId(prod.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedProductId === prod.id
                    ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{prod.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Type: <span className="capitalize">{prod.type}</span> • Setup Fee: ${prod.setupFee}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-950 text-sm">
                      {formatCurrency(prod.priceMonthly ?? prod.pricing[0]?.price ?? 0)}
                    </div>
                    <div className="text-[10px] text-slate-400">/month</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div className="text-xs text-slate-600">
              {selectedProduct && (
                <span>
                  New rate: <strong>{formatCurrency(selectedProduct.priceMonthly ?? selectedProduct.pricing[0]?.price ?? 0)}</strong> /month
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleExecutePlanChange}
              >
                Confirm Plan Change
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Service Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Service Cancellation
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will suspend <strong className="text-slate-900">{service.domain}</strong> and revoke DNS routing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="Project completed">Project completed</option>
                <option value="Switching to another provider">Switching to another provider</option>
                <option value="Too expensive">Too expensive</option>
                <option value="Technical issues">Technical issues</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">
                To confirm, type <span className="font-mono text-rose-600">{service.domain}</span>:
              </label>
              <Input
                value={cancelConfirmText}
                onChange={(e) => setCancelConfirmText(e.target.value)}
                placeholder={service.domain || 'domain.com'}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Service
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={cancelConfirmText !== service.domain}
              onClick={handleConfirmCancel}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
