'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, ShoppingCart, Zap, Shield, Sparkles } from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/demo/selectors';
import * as workflows from '@/lib/demo/workflows';
import type { BillingCycle, Product, StorefrontConfig, StorefrontSection } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';

interface FeaturedPlansSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function FeaturedPlansSection({ section, config }: FeaturedPlansSectionProps) {
  const { state, setState } = useDemo();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';

  const headline = settings.headline || 'Hosting plans built for every scale';
  const subtitle =
    settings.subtitle ||
    'All plans include automated snapshot backups, free SSL certificates, and isolated container execution';

  // Filter products: either specified in section settings, or in config.displayedProductIds, or fallback to available shared hosting & vps
  const productIds = settings.productIds || config.displayedProductIds || ['prod_001', 'prod_002', 'prod_003'];
  const displayedProducts = state.products.filter(
    (p) => p.available && productIds.includes(p.id)
  );

  function handleAddToCart(product: Product) {
    const pricing = product.pricing.find((pr) => pr.cycle === billingCycle) || product.pricing[0];
    if (!pricing) {
      toast.error('Selected pricing cycle is not available for this product.');
      return;
    }

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
    <section id="plans" className="bg-slate-50/60 py-16 sm:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white">
            Hosting & Compute Packages
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{headline}</h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">{subtitle}</p>

          {/* Billing Cycle Toggle */}
          {settings.showBillingToggle !== false && (
            <div className="pt-4 flex items-center justify-center">
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annually')}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                    billingCycle === 'annually'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Annual Billing</span>
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    Save up to 17%
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {displayedProducts.map((product) => {
            // Find pricing for the selected cycle or fallback to first available
            const cyclePrice =
              product.pricing.find((pr) => pr.cycle === billingCycle) || product.pricing[0];
            const price = cyclePrice ? cyclePrice.price : 0;
            const cycleLabel = cyclePrice?.cycle === 'annually' ? '/yr' : '/mo';

            // Calculate savings if annual
            const monthlyPrice = product.pricing.find((pr) => pr.cycle === 'monthly')?.price;
            const annualPrice = product.pricing.find((pr) => pr.cycle === 'annually')?.price;
            let savingsPercent = 0;
            if (monthlyPrice && annualPrice && billingCycle === 'annually') {
              savingsPercent = Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100);
            }

            const badgeText = settings.badgeForProduct?.[product.id] || (product.id === 'prod_002' ? 'Most Popular' : null);
            const isHighlighted = product.id === 'prod_002';

            return (
              <Card
                key={product.id}
                className={`relative flex flex-col justify-between overflow-hidden bg-white transition-all hover:shadow-lg ${
                  isHighlighted ? 'border-2 shadow-md ring-1 ring-slate-900/5' : 'border border-slate-200 shadow-xs'
                }`}
                style={isHighlighted ? { borderColor: primaryColor } : undefined}
              >
                {badgeText && (
                  <div
                    className="absolute top-0 right-0 rounded-bl-lg px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {badgeText}
                  </div>
                )}

                <div>
                  <CardHeader className="space-y-2 pb-4">
                    <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
                    <p className="text-xs text-slate-500 min-h-[36px]">{product.description}</p>
                    {config.showProductPricing && (
                      <div className="pt-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold tracking-tight text-slate-950">
                            {formatCurrency(price)}
                          </span>
                          <span className="text-sm font-medium text-slate-500">{cycleLabel}</span>
                        </div>
                        {savingsPercent > 0 && (
                          <div className="text-xs font-semibold text-emerald-600 mt-1">
                            Save {savingsPercent}% compared to monthly billing
                          </div>
                        )}
                        {product.setupFee > 0 ? (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            +{formatCurrency(product.setupFee)} one-time setup fee
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">Free setup included</div>
                        )}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Included Specifications
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-700">
                      {product.resourceLimits.map((limit, idx) => (
                        <li key={idx} className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong className="font-semibold text-slate-900">{limit.value}</strong> {limit.label}
                          </span>
                        </li>
                      ))}
                      <li className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Free SSL & Daily Automated Backups</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Isolated Containerized Compute</span>
                      </li>
                    </ul>
                  </CardContent>
                </div>

                <CardFooter className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <Button
                    asChild
                    className="w-full text-white font-semibold text-xs shadow-sm hover:opacity-95 h-10"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Link
                      href={`/storefront/checkout?productId=${product.id}&cycle=${cyclePrice ? cyclePrice.cycle : 'monthly'}`}
                    >
                      Order Now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>

                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      className="w-full text-xs gap-1.5 h-8 bg-white hover:bg-slate-50"
                    >
                      <ShoppingCart className="h-3.5 w-3.5 text-slate-600" />
                      Add to Cart
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="w-full text-xs h-8 text-slate-600">
                      <Link href={`/storefront/hosting/${product.id}`}>View Specs</Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center pt-4">
          <Link
            href="/storefront/hosting"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 underline"
          >
            Compare all hosting packages and technical limits →
          </Link>
        </div>
      </div>
    </section>
  );
}
