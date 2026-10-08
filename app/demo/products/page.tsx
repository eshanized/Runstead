'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Package, Pencil, Eye, Archive } from 'lucide-react';
import { DemoShell } from '@/components/demo/demo-shell';
import { DemoPageHeader, DemoEmptyState } from '@/components/demo/demo-helpers';
import { useDemo, generateId } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import { searchProducts, filterProductsByType, formatCurrency } from '@/lib/demo/selectors';
import type { Product, ProductType, BillingCycle } from '@/lib/demo/types';
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

export default function ProductsPage() {
  return (
    <DemoShell>
      <ProductsContent />
    </DemoShell>
  );
}

function ProductsContent() {
  const { state, setState } = useDemo();
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

  function handleSave(product: Product) {
    try {
      setState((prev) => workflows.updateProduct(prev, product.id, product));
      setEditProduct(null);
      toast.success(`Product ${product.name} updated`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update product');
    }
  }

  function handleCreate(productData: Omit<Product, 'id'>) {
    try {
      setState((prev) => workflows.createProduct(prev, productData));
      setCreateOpen(false);
      toast.success(`Product ${productData.name} created`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create product');
    }
  }

  function handleToggleAvailability(productId: string, currentVal: boolean) {
    try {
      setState((prev) => workflows.toggleProductAvailability(prev, productId, !currentVal));
      toast.success(`Product visibility updated`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update availability');
    }
  }

  function handleArchive(product: Product) {
    if (!confirm(`Archive product "${product.name}"? It will be removed from the public storefront and marked unavailable.`)) return;
    try {
      setState((prev) => workflows.archiveProduct(prev, product.id));
      toast.success(`Product ${product.name} archived`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive product');
    }
  }

  return (
    <>
      <DemoPageHeader
        title="Products"
        description={`${state.products.length} products in catalog`}
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>}
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
        <DemoEmptyState icon={Package} title="No products found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <Badge variant="secondary" className="mt-1">{typeLabels[p.type]}</Badge>
                  </div>
                  <Switch
                    checked={p.available}
                    onCheckedChange={() => handleToggleAvailability(p.id, p.available)}
                    aria-label={`Toggle availability for ${p.name}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
                <div className="space-y-1">
                  {p.pricing.map((pr) => (
                    <div key={pr.cycle} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{pr.cycle.replace('_', ' ')}</span>
                      <span className="font-medium">{formatCurrency(pr.price, state.business.currency)}</span>
                    </div>
                  ))}
                </div>
                {p.setupFee > 0 && <div className="mt-2 text-xs text-muted-foreground">Setup fee: {formatCurrency(p.setupFee, state.business.currency)}</div>}
                <div className="mt-3 flex items-center justify-between pt-2 border-t">
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
      <DialogContent className="max-w-lg">
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
          <div>
            <h4 className="text-sm font-semibold mb-2">Resource Limits</h4>
            <div className="grid grid-cols-2 gap-2">
              {product.resourceLimits.map((r) => (
                <div key={r.label} className="rounded-lg border p-2 text-sm">
                  <span className="text-muted-foreground">{r.label}: </span>
                  <span className="font-medium">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
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
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    const saved = {
      ...(product ? { id: product.id } : {}),
      name: name.trim(),
      type,
      description: description.trim(),
      pricing,
      setupFee: parseFloat(setupFee) || 0,
      resourceLimits: product?.resourceLimits ?? [{ label: 'Storage', value: '10 GB' }],
      available,
      addons: product?.addons ?? [],
    };
    onSave(saved);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
          <DialogDescription>{product ? 'Update product information' : 'Create a new demo product'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="name">Name *</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div>
          <div className="space-y-2">
            <Label>Type</Label>
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
          <div className="space-y-2"><Label htmlFor="desc">Description *</Label><Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />{errors.description && <p className="text-xs text-destructive">{errors.description}</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="monthly">Monthly Price</Label><Input id="monthly" type="number" step="0.01" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} placeholder="0.00" /></div>
            <div className="space-y-2"><Label htmlFor="annual">Annual Price</Label><Input id="annual" type="number" step="0.01" value={annualPrice} onChange={(e) => setAnnualPrice(e.target.value)} placeholder="0.00" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="setup">Setup Fee</Label><Input id="setup" type="number" step="0.01" value={setupFee} onChange={(e) => setSetupFee(e.target.value)} /></div>
          <div className="flex items-center gap-2"><Switch id="avail" checked={available} onCheckedChange={setAvailable} /><Label htmlFor="avail">Available for purchase</Label></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{product ? 'Save Changes' : 'Create Product'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
