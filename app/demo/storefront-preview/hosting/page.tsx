'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  ArrowRight,
  Check,
  ShoppingCart,
  Server,
  Zap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/demo/selectors';
import * as workflows from '@/lib/demo/workflows';
import type { BillingCycle, Product } from '@/lib/demo/types';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function HostingCatalogPage() {
  const { state, setState } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name'>('price_asc');

  // Filter products for hosting catalog
  const hostingProducts = state.products.filter(
    (p) => p.available && ['shared_hosting', 'vps', 'managed_service'].includes(p.type)
  );

  const filtered = hostingProducts
    .filter((p) => {
      if (selectedType !== 'all' && p.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.resourceLimits.some((l) => l.value.toLowerCase().includes(query) || l.label.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      const priceA = a.pricing.find((pr) => pr.cycle === billingCycle)?.price || a.pricing[0]?.price || 0;
      const priceB = b.pricing.find((pr) => pr.cycle === billingCycle)?.price || b.pricing[0]?.price || 0;

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      return a.name.localeCompare(b.name);
    });

  function handleAddToCart(product: Product) {
    const cyclePrice = product.pricing.find((pr) => pr.cycle === billingCycle) || product.pricing[0];
    if (!cyclePrice) {
      toast.error('Selected billing cycle not supported.');
      return;
    }

    try {
      setState((prev) =>
        workflows.addToCart(prev, {
          productId: product.id,
          productName: product.name,
          productType: product.type,
          billingCycle: cyclePrice.cycle,
          unitPrice: cyclePrice.price,
          setupFee: product.setupFee || 0,
          quantity: 1,
          selectedAddons: [],
        })
      );
      toast.success(`"${product.name}" added to shopping cart!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to cart');
    }
  }

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white">
              Hosting Catalog
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Hosting Catalog & Cloud Servers
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              High-performance compute nodes, cPanel-compatible environments, and scalable virtual private servers.
            </p>
          </div>

          {/* Filter & Search Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filter by plan name or specs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-xs"
                />
              </div>

              {/* Type Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                {[
                  ['all', 'All Packages'],
                  ['shared_hosting', 'Shared Hosting'],
                  ['vps', 'Cloud VPS'],
                  ['managed_service', 'Managed WordPress'],
                ].map(([typeVal, label]) => (
                  <button
                    key={typeVal}
                    type="button"
                    onClick={() => setSelectedType(typeVal)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      selectedType === typeVal
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Sort & Cycle */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <Select
                  value={billingCycle}
                  onValueChange={(val) => setBillingCycle(val as BillingCycle)}
                >
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <SelectValue placeholder="Cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annually">Annual (Save)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="name">Plan Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
              <Server className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-base text-slate-900">No matching hosting plans found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing your search query or switching to another category filter.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                }}
                className="text-xs"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((prod) => {
                const pricing =
                  prod.pricing.find((pr) => pr.cycle === billingCycle) || prod.pricing[0];
                const price = pricing ? pricing.price : 0;
                const cycleText = pricing?.cycle === 'annually' ? '/yr' : '/mo';

                return (
                  <Card
                    key={prod.id}
                    className="flex flex-col justify-between overflow-hidden bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div>
                      <CardHeader className="space-y-2 pb-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-slate-900">{prod.name}</h3>
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                            {prod.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 min-h-[32px]">{prod.description}</p>
                        <div className="pt-2 flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-slate-950">
                            {formatCurrency(price)}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{cycleText}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                        <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                          Resource Specifications
                        </div>
                        <ul className="space-y-2 text-slate-600">
                          {prod.resourceLimits.map((limit, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span>
                                <strong className="font-semibold text-slate-900">{limit.value}</strong> {limit.label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </div>

                    <CardFooter className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <Button
                        asChild
                        className="w-full text-white font-semibold text-xs h-9 shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Link
                          href={`/demo/checkout?productId=${prod.id}&cycle=${pricing?.cycle || 'monthly'}`}
                        >
                          Order Now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>

                      <div className="flex w-full gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToCart(prod)}
                          className="w-full text-xs gap-1.5 h-8 bg-white"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Add to Cart
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="w-full text-xs h-8 text-slate-600">
                          <Link href={`/demo/storefront-preview/hosting/${prod.id}`}>Details</Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  );
}
