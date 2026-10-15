'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Server,
  HardDrive,
  ShieldCheck,
  Zap,
  ArrowRight,
  ShoppingCart,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/demo/selectors';
import * as workflows from '@/lib/demo/workflows';
import type { BillingCycle, Product } from '@/lib/demo/types';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';

export default function VpsCatalogPage() {
  const { state, setState } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const vpsProducts = state.products.filter((p) => p.type === 'vps' && p.available);

  function handleAddToCart(product: Product) {
    const cyclePrice = product.pricing.find((pr) => pr.cycle === billingCycle) || product.pricing[0];
    if (!cyclePrice) {
      toast.error('Selected billing cycle not available.');
      return;
    }

    try {
      setState((prev) =>
        workflows.addToCart(prev, {
          productId: product.id,
          productName: product.name,
          productType: 'vps',
          billingCycle: cyclePrice.cycle,
          unitPrice: cyclePrice.price,
          setupFee: product.setupFee || 0,
          quantity: 1,
          selectedAddons: [],
        })
      );
      toast.success(`"${product.name}" added to cart!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to cart');
    }
  }

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-900 text-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-3">
            <Badge variant="outline" className="border-slate-700 text-slate-300 bg-slate-800 text-xs">
              Cloud Compute Fleet
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Cloud VPS & Virtual Private Servers
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Dedicated compute, KVM hypervisor isolation, fast NVMe arrays, and full root privileges across worldwide edge nodes.
            </p>

            {/* Cycle toggle */}
            <div className="pt-4 flex items-center justify-center">
              <div className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-800/80 p-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                    billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('quarterly')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                    billingCycle === 'quarterly' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Quarterly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annually')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                    billingCycle === 'annually' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Annual (Best Value)
                </button>
              </div>
            </div>
          </div>

          {/* VPS Cards */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {vpsProducts.map((vps) => {
              const pricing =
                vps.pricing.find((pr) => pr.cycle === billingCycle) || vps.pricing[0];
              const price = pricing ? pricing.price : 0;
              const cycleLabel =
                pricing?.cycle === 'annually' ? '/yr' : pricing?.cycle === 'quarterly' ? '/qtr' : '/mo';

              return (
                <Card
                  key={vps.id}
                  className="flex flex-col justify-between border border-slate-800 bg-slate-800/90 text-white shadow-xl backdrop-blur"
                >
                  <CardHeader className="space-y-3 pb-4 border-b border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-white">{vps.name}</h3>
                      <Badge className="bg-blue-900/60 text-blue-300 border border-blue-500/40 text-xs">
                        KVM Cloud
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">{vps.description}</p>
                    <div className="pt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-white">{formatCurrency(price)}</span>
                      <span className="text-xs text-slate-400 font-medium">{cycleLabel}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {vps.resourceLimits.map((l, idx) => (
                        <div key={idx} className="rounded-lg bg-slate-900/80 p-3 border border-slate-700/50">
                          <div className="text-[10px] uppercase font-bold text-slate-400">{l.label}</div>
                          <div className="text-sm font-bold text-white mt-0.5">{l.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 space-y-2 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Root access via SSH (Ubuntu, Debian, AlmaLinux, Rocky)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Dedicated static IPv4 address and /64 IPv6 subnet</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Real-time CPU & network telemetry graphs in customer portal</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 border-t border-slate-700/60 flex flex-col gap-2">
                    <Button
                      asChild
                      className="w-full text-white font-semibold text-xs h-10 shadow-md"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Link href={`/demo/checkout?productId=${vps.id}&cycle=${pricing?.cycle || 'monthly'}`}>
                        Configure Server <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <div className="flex w-full gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToCart(vps)}
                        className="w-full text-xs gap-1.5 h-9 border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Add to Cart
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="w-full text-xs h-9 text-slate-400 hover:text-white">
                        <Link href={`/demo/storefront-preview/hosting/${vps.id}`}>View Limits</Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Architecture comparison */}
          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-8 text-center max-w-4xl mx-auto space-y-4">
            <h3 className="text-xl font-bold text-white">Why our Cloud VPS fleet?</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Each VPS runs on enterprise hypervisors with ECC RAM, RAID-10 enterprise NVMe arrays, and dedicated 10 Gbps uplinks.
              No shared kernel or noisy neighbors.
            </p>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
