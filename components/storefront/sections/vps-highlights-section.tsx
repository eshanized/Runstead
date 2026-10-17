'use client';

import Link from 'next/link';
import { Cpu, Server, HardDrive, ShieldCheck, ArrowRight, ShoppingCart } from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/demo/selectors';
import * as workflows from '@/lib/demo/workflows';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface VpsHighlightsSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function VpsHighlightsSection({ section, config }: VpsHighlightsSectionProps) {
  const { state, setState } = useDemo();
  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';

  const headline = settings.headline || 'Virtual Private Servers with raw performance';
  const subtitle = settings.subtitle || 'Dedicated vCPU, RAM, and NVMe SSD storage without noisy neighbor contention';

  const vpsProducts = state.products.filter((p) => p.type === 'vps' && p.available);

  function handleAddToCart(productId: string) {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;
    const pricing = product.pricing.find((pr) => pr.cycle === 'monthly') || product.pricing[0];

    try {
      setState((prev) =>
        workflows.addToCart(prev, {
          productId: product.id,
          productName: product.name,
          productType: 'vps',
          billingCycle: pricing.cycle,
          unitPrice: pricing.price,
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
    <section id="vps" className="bg-slate-900 text-white py-16 sm:py-24 border-b border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-slate-700 text-slate-300 bg-slate-800">
            Dedicated Cloud Compute
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{headline}</h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {vpsProducts.map((vps) => {
            const monthlyPrice = vps.pricing.find((pr) => pr.cycle === 'monthly')?.price || vps.pricing[0]?.price || 0;
            return (
              <Card key={vps.id} className="border border-slate-800 bg-slate-800/80 text-white shadow-xl backdrop-blur">
                <CardHeader className="space-y-2 pb-4 border-b border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{vps.name}</h3>
                    <Badge variant="outline" className="border-blue-400/40 text-blue-300 bg-blue-950/40 text-[11px]">
                      Full Root Access
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">{vps.description}</p>
                  <div className="pt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">{formatCurrency(monthlyPrice)}</span>
                    <span className="text-sm text-slate-400">/mo</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-2 gap-3">
                    {vps.resourceLimits.map((limit, idx) => (
                      <div key={idx} className="rounded-lg bg-slate-900/60 p-3 border border-slate-700/40">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {limit.label}
                        </div>
                        <div className="text-sm font-bold text-white mt-0.5">{limit.value}</div>
                      </div>
                    ))}
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300 pt-2">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Dedicated IPv4 Address & IPv6 Subnet</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Instant Power, Reboot, and OS Reinstall API</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>KVM Virtualization & Strict Memory Boundaries</span>
                    </li>
                  </ul>
                </CardContent>

                <CardFooter className="pt-4 border-t border-slate-700/60 flex gap-2">
                  <Button
                    asChild
                    className="w-full text-white font-semibold text-xs h-10 shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Link href={`/storefront/checkout?productId=${vps.id}&cycle=monthly`}>
                      Deploy Server <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAddToCart(vps.id)}
                    className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800 text-xs gap-1.5 h-10 px-3"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <Button asChild variant="outline" className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800 text-xs">
            <Link href="/storefront/vps">
              Compare Full VPS Fleet Specifications →
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
