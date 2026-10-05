'use client';

import Link from 'next/link';
import {
  Sparkles,
  Globe,
  RotateCcw,
  ShieldCheck,
  Check,
  ArrowRight,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/demo/selectors';
import * as workflows from '@/lib/demo/workflows';
import type { Product } from '@/lib/demo/types';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ManagedServicesPage() {
  const { state, setState } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const managedProducts = state.products.filter(
    (p) => ['managed_service', 'dns_management', 'add_on'].includes(p.type) && p.available
  );

  function handleAddToCart(product: Product) {
    const pricing = product.pricing[0];
    if (!pricing) return;

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
      toast.success(`"${product.name}" added to shopping cart!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to cart');
    }
  }

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
              Turnkey Infrastructure Management
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Managed WordPress & Cloud Services
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Eliminate server maintenance, core updates, and DNS configuration friction. Our managed stack runs on isolated containers with automated daily snapshots.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-5xl mx-auto items-stretch">
            {managedProducts.map((prod) => {
              const pricing = prod.pricing[0];
              const price = pricing ? pricing.price : 0;
              const cycleText = pricing?.cycle === 'annually' ? '/yr' : '/mo';

              return (
                <Card
                  key={prod.id}
                  className="flex flex-col justify-between border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-purple-300 transition-all"
                >
                  <div>
                    <CardHeader className="space-y-2 pb-4">
                      <div className="flex items-center justify-between">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Sparkles className="h-5 w-5" />
                        </span>
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                          {prod.type.replace('_', ' ')}
                        </Badge>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 pt-2">{prod.name}</h3>
                      <p className="text-xs text-slate-500 min-h-[36px]">{prod.description}</p>

                      <div className="pt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-950">
                          {formatCurrency(price)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{cycleText}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                      <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                        Service Specifications
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
                        <li className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Automated 24/7 Security Health Checks</span>
                        </li>
                      </ul>
                    </CardContent>
                  </div>

                  <CardFooter className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <Button
                      asChild
                      className="w-full text-white font-semibold text-xs h-9 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Link href={`/demo/checkout?productId=${prod.id}&cycle=${pricing?.cycle || 'monthly'}`}>
                        Order Now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddToCart(prod)}
                      className="w-full text-xs gap-1.5 h-8 bg-white"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
