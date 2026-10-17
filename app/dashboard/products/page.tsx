'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Package, Pencil, Eye, Archive, ShieldCheck, Check, Layers, HardDrive } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardPageHeader, DashboardEmptyState } from '@/components/dashboard/dashboard-helpers';
import { useDemo, generateId } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import { searchProducts, filterProductsByType, formatCurrency } from '@/lib/demo/selectors';
import type { Product, ProductType, BillingCycle, CapabilityId, PlanLimits } from '@/lib/demo/types';
import { CAPABILITY_REGISTRY } from '@/lib/demo/capabilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const typeLabels: Record<ProductType, string> = {
  shared_hosting: 'Shared Hosting',
  vps: 'VPS',
  domain_registration: 'Domain Registration',
  dns_management: 'DNS Management',
  managed_service: 'Managed Service',
  add_on: 'Add-on',
};

const ALL_CAPABILITIES: { id: CapabilityId; label: string }[] = [
  { id: 'file_manager', label: 'File Manager' },
  { id: 'databases', label: 'Databases (MySQL)' },
  { id: 'email_accounts', label: 'Email Accounts' },
  { id: 'backups', label: 'Backups & Snapshots' },
  { id: 'ssl_certificates', label: 'SSL Certificates' },
  { id: 'vps_power', label: 'VPS Hypervisor Power' },
  { id: 'developer_tools', label: 'Git & Developer Tools' },
  { id: 'domain_management', label: 'Domains & DNS' },
  { id: 'activity_monitoring', label: 'Telemetry & Logs' },
];

export default function ProductsPage() {
  return (
    <DashboardShell>
      <ProductsContent />
    </DashboardShell>
  );
}

function ProductsContent() {
  const { state, setState, syncFromServer } = useDemo();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = searchProducts(state.products, search);
    result = filterProductsByType(result, typeFilter);
    return result;
  }, [state.products, search, typeFilter]);

  async function handleSave(product: Product) {
    try {
      const res = await fetch(`/api/reseller/products/${product.id}?tenantId=default`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          type: product.type,
          description: product.description,
          setupFee: product.setupFee,
          available: product.available,
          pricing: product.pricing,
          resourceLimits: product.planLimits,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update product');
      }
      await syncFromServer();
      setEditProduct(null);
      toast.success(`Product ${product.name} saved to database.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update product');
    }
  }

  async function handleCreate(productData: Omit<Product, 'id'>) {
    try {
      const res = await fetch('/api/reseller/products?tenantId=default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productData.name,
          type: productData.type,
          description: productData.description,
          setupFee: productData.setupFee,
          available: productData.available,
          pricing: productData.pricing,
          resourceLimits: productData.planLimits,
          addons: productData.addons,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to create product');
      }
      await syncFromServer();
      setCreateOpen(false);
      toast.success(`Product ${productData.name} saved to database.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create product');
    }
  }

  async function handleToggleAvailability(productId: string, currentVal: boolean) {
    try {
      const res = await fetch(`/api/reseller/products/${productId}?tenantId=default`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !currentVal }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to toggle availability');
      }
      await syncFromServer();
      toast.success(`Product visibility updated.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update availability');
    }
  }

  async function handleArchive(product: Product) {
    if (!confirm(`Archive product "${product.name}"? It will be removed from the catalog.`)) return;
    try {
      const res = await fetch(`/api/reseller/products/${product.id}?tenantId=default`, {
        method: 'DELETE',
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to archive product');
      }
      await syncFromServer();
      toast.success(`Product ${product.name} archived in database.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive product');
    }
  }

  return (
    <>
      <DashboardPageHeader
        title="Products & Hosting Packages"
        description={`${state.products.length} catalog offerings with capability limits`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="shared_hosting">Shared Hosting</SelectItem>
            <SelectItem value="vps">VPS</SelectItem>
            <SelectItem value="domain_registration">Domain Registration</SelectItem>
            <SelectItem value="dns_management">DNS Management</SelectItem>
            <SelectItem value="managed_service">Managed Service</SelectItem>
            <SelectItem value="add_on">Add-on</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <DashboardEmptyState icon={Package} title="No products found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-base">{p.name}</h3>
                    <Badge variant="secondary" className="mt-1">{typeLabels[p.type]}</Badge>
                  </div>
                  <Switch
                    checked={p.available}
                    onCheckedChange={() => handleToggleAvailability(p.id, p.available)}
                    aria-label={`Toggle availability for ${p.name}`}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                <div className="space-y-1">
                  {p.pricing.map((pr) => (
                    <div key={pr.cycle} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{pr.cycle.replace('_', ' ')}</span>
                      <span className="font-medium">{formatCurrency(pr.price, state.business.currency)}</span>
                    </div>
                  ))}
                </div>

                {/* Capabilities Badges */}
                <div className="space-y-1 pt-1">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Client Capabilities
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(p.capabilities || ['file_manager', 'databases']).slice(0, 4).map((cap) => (
                      <Badge key={cap} variant="outline" className="text-[10px] bg-slate-50">
                        {cap.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {(p.capabilities?.length || 0) > 4 && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        +{(p.capabilities?.length || 0) - 4} more
                      </Badge>
                    )}
                  </div>
                </div>

                {p.setupFee > 0 && <div className="text-xs text-muted-foreground">Setup fee: {formatCurrency(p.setupFee, state.business.currency)}</div>}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewProduct(p)}><Eye className="mr-1 h-3.5 w-3.5" /> View</Button>
                    <Button variant="outline" size="sm" onClick={() => setEditProduct(p)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                  </div>
                  {p.available && (
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => handleArchive(p)}>
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewProduct && <ProductDetailDialog product={viewProduct} currency={state.business.currency} onClose={() => setViewProduct(null)} />}
      {editProduct && <ProductFormDialog product={editProduct} onSave={handleSave} onClose={() => setEditProduct(null)} />}
      {createOpen && <ProductFormDialog onSave={handleCreate} onClose={() => setCreateOpen(false)} />}
    </>
  );
}

function ProductDetailDialog({ product, currency, onClose }: { product: Product; currency: string; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{typeLabels[product.type]}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm">{product.description}</p>
          <div>
            <h4 className="text-sm font-semibold mb-2">Pricing</h4>
            <div className="space-y-1">
              {product.pricing.map((pr) => (
                <div key={pr.cycle} className="flex justify-between text-sm border-b pb-1">
                  <span className="capitalize">{pr.cycle.replace('_', ' ')}</span>
                  <span className="font-medium">{formatCurrency(pr.price, currency)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enabled Capabilities */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Client Control Center Capabilities</h4>
            <div className="flex flex-wrap gap-1.5">
              {(product.capabilities || []).map((cap) => (
                <Badge key={cap} variant="secondary" className="capitalize text-xs">
                  {cap.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Plan Quotas */}
          {product.planLimits && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Plan Limits & Quotas</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border p-2">
                  <span className="text-muted-foreground">Storage: </span>
                  <span className="font-bold">{product.planLimits.storageGB} GB</span>
                </div>
                <div className="rounded-lg border p-2">
                  <span className="text-muted-foreground">Bandwidth: </span>
                  <span className="font-bold">{product.planLimits.bandwidthGB} GB</span>
                </div>
                <div className="rounded-lg border p-2">
                  <span className="text-muted-foreground">Max Databases: </span>
                  <span className="font-bold">{product.planLimits.databases}</span>
                </div>
                <div className="rounded-lg border p-2">
                  <span className="text-muted-foreground">Max Mailboxes: </span>
                  <span className="font-bold">{product.planLimits.emailAccounts}</span>
                </div>
              </div>
            </div>
          )}

          {product.addons.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Add-ons</h4>
              <div className="space-y-1">
                {product.addons.map((a) => (
                  <div key={a.name} className="flex justify-between text-sm">
                    <span>{a.name}</span>
                    <span className="font-medium">{formatCurrency(a.price, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Availability:</span>
            <Badge variant={product.available ? 'default' : 'secondary'}>{product.available ? 'Available' : 'Unavailable'}</Badge>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductFormDialog({ product, onSave, onClose }: { product?: Product; onSave: (p: any) => void; onClose: () => void }) {
  const [name, setName] = useState(product?.name ?? '');
  const [type, setType] = useState<ProductType>(product?.type ?? 'shared_hosting');
  const [description, setDescription] = useState(product?.description ?? '');
  const [monthlyPrice, setMonthlyPrice] = useState(product?.pricing.find((p) => p.cycle === 'monthly')?.price.toString() ?? '');
  const [annualPrice, setAnnualPrice] = useState(product?.pricing.find((p) => p.cycle === 'annually')?.price.toString() ?? '');
  const [setupFee, setSetupFee] = useState(product?.setupFee.toString() ?? '0');
  const [available, setAvailable] = useState(product?.available ?? true);

  // Capabilities
  const [selectedCaps, setSelectedCaps] = useState<CapabilityId[]>(
    product?.capabilities ?? ['file_manager', 'databases', 'email_accounts', 'backups', 'ssl_certificates']
  );

  // Plan Limits
  const [storageGB, setStorageGB] = useState(product?.planLimits?.storageGB?.toString() ?? '25');
  const [bandwidthGB, setBandwidthGB] = useState(product?.planLimits?.bandwidthGB?.toString() ?? '500');
  const [maxDbs, setMaxDbs] = useState(product?.planLimits?.databases?.toString() ?? '5');
  const [maxEmails, setMaxEmails] = useState(product?.planLimits?.emailAccounts?.toString() ?? '10');

  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleCap(id: CapabilityId) {
    setSelectedCaps((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!description.trim()) e.description = 'Description is required';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const pricing: { cycle: BillingCycle; price: number }[] = [];
    if (monthlyPrice) pricing.push({ cycle: 'monthly', price: parseFloat(monthlyPrice) });
    if (annualPrice) pricing.push({ cycle: 'annually', price: parseFloat(annualPrice) });
    if (pricing.length === 0) pricing.push({ cycle: 'monthly', price: 0 });

    const planLimits: PlanLimits = {
      storageGB: parseInt(storageGB, 10) || 25,
      bandwidthGB: parseInt(bandwidthGB, 10) || 500,
      databases: parseInt(maxDbs, 10) || 5,
      emailAccounts: parseInt(maxEmails, 10) || 10,
      subdomains: 10,
    };

    const saved = {
      ...(product ? { id: product.id } : {}),
      name: name.trim(),
      type,
      description: description.trim(),
      pricing,
      priceMonthly: parseFloat(monthlyPrice) || 0,
      setupFee: parseFloat(setupFee) || 0,
      resourceLimits: [
        { label: 'Storage', value: `${planLimits.storageGB} GB` },
        { label: 'Bandwidth', value: `${planLimits.bandwidthGB} GB` },
      ],
      capabilities: selectedCaps,
      planLimits,
      available,
      addons: product?.addons ?? [],
    };
    onSave(saved);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product & Capabilities' : 'Add Product'}</DialogTitle>
          <DialogDescription>
            {product
              ? 'Update specifications, pricing, and control center capabilities. Changes cascade to active customer services.'
              : 'Create a new catalog product with resource limits.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-1">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label>Package Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ProductType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="shared_hosting">Shared Hosting</SelectItem>
                <SelectItem value="vps">VPS</SelectItem>
                <SelectItem value="domain_registration">Domain Registration</SelectItem>
                <SelectItem value="dns_management">DNS Management</SelectItem>
                <SelectItem value="managed_service">Managed Service</SelectItem>
                <SelectItem value="add_on">Add-on</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description *</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly">Monthly Price ($)</Label>
              <Input id="monthly" type="number" step="0.01" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual">Annual Price ($)</Label>
              <Input id="annual" type="number" step="0.01" value={annualPrice} onChange={(e) => setAnnualPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          {/* Capabilities Selector */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Enabled Client Control Center Capabilities
            </Label>
            <p className="text-xs text-muted-foreground">
              Determines which management tabs and features customers can use in their Hosting Control Center.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {ALL_CAPABILITIES.map((cap) => {
                const isSelected = selectedCaps.includes(cap.id);
                return (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => toggleCap(cap.id)}
                    className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{cap.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plan Limits */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Plan Limits & Quotas
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label htmlFor="st" className="text-xs">Storage (GB)</Label>
                <Input id="st" type="number" value={storageGB} onChange={(e) => setStorageGB(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bw" className="text-xs">Bandwidth (GB)</Label>
                <Input id="bw" type="number" value={bandwidthGB} onChange={(e) => setBandwidthGB(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dbs" className="text-xs">Databases</Label>
                <Input id="dbs" type="number" value={maxDbs} onChange={(e) => setMaxDbs(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="em" className="text-xs">Mailboxes</Label>
                <Input id="em" type="number" value={maxEmails} onChange={(e) => setMaxEmails(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Switch id="avail" checked={available} onCheckedChange={setAvailable} />
            <Label htmlFor="avail">Available for purchase in Storefront</Label>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{product ? 'Save & Propagate Changes' : 'Create Product'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
