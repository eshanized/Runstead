'use client';

import Link from 'next/link';
import { Sparkles, Globe, Shield, RefreshCw, Check, ArrowRight, ShoppingCart } from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/demo/selectors';
import * as workflows from '@/lib/demo/workflows';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface ManagedHostingSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function ManagedHostingSection({ section, config }: ManagedHostingSectionProps) {
  const { state, setState } = useDemo();
  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';

  const headline = settings.headline || 'Managed applications and specialized infrastructure';
  const subtitle = settings.subtitle || 'Automate system patching, caching layers, and Anycast DNS so you can focus on building';

  const managedProducts = state.products.filter(
    (p) => ['managed_service', 'dns_management', 'add_on'].includes(p.type) && p.available
  );

  function handleAddToCart(productId: string) {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;
    const pricing = product.pricing.find((pr) => pr.cycle === 'monthly') || product.pricing[0];

    try {
      setState((prev) =>
        workflows.addToCart(prev, {
          productId: product.id,
          productName: product.name,
          productType: product.type,
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
    <section className="bg-slate-50 py-16 sm:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
            Managed Hosting & DNS
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{headline}</h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {managedProducts.map((prod) => {
            const monthlyPrice = prod.pricing.find((pr) => pr.cycle === 'monthly')?.price || prod.pricing[0]?.price || 0;
            const cycleText = prod.pricing[0]?.cycle === 'annually' ? '/yr' : '/mo';

            return (
              <Card key={prod.id} className="border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {prod.type.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-slate-900">{prod.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed min-h-[32px]">{prod.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1 py-1">
                    <span className="text-3xl font-extrabold text-slate-950">{formatCurrency(monthlyPrice)}</span>
                    <span className="text-xs text-slate-500">{cycleText}</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-4">
                    {prod.resourceLimits.map((limit, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>
                          <strong className="font-semibold text-slate-900">{limit.value}</strong> {limit.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 flex gap-2">
                    <Button
                      asChild
                      className="w-full text-white text-xs font-semibold h-9 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Link href={`/storefront/checkout?productId=${prod.id}&cycle=${prod.pricing[0]?.cycle || 'monthly'}`}>
                        Order Now
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddToCart(prod.id)}
                      className="h-9 px-3 text-xs"
                    >
                      <ShoppingCart className="h-3.5 w-3.5 text-slate-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
