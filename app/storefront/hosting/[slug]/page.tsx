'use client';

import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import {
  Check,
  ArrowRight,
  ShoppingCart,
  ShieldCheck,
  Server,
  Zap,
  RotateCcw,
  Plus,
  HelpCircle,
  ChevronLeft,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/demo/selectors';
import * as workflows from '@/lib/demo/workflows';
import type { BillingCycle } from '@/lib/demo/types';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const slugParam = (params?.slug as string) || '';

  const { state, setState } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  // Find product by id or slugified name
  const product = state.products.find(
    (p) =>
      p.id.toLowerCase() === slugParam.toLowerCase() ||
      p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slugParam.toLowerCase()
  );

  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(
    product?.pricing[0]?.cycle || 'monthly'
  );
  const [selectedAddons, setSelectedAddons] = useState<Array<{ name: string; price: number }>>([]);

  if (!product) {
    return (
      <StorefrontLayout overrideConfig={config}>
        <div className="py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Product Not Found</h1>
          <p className="text-sm text-slate-600">The requested hosting package could not be located in our catalog.</p>
          <Button asChild className="text-xs">
            <Link href="/storefront/hosting">Browse Catalog</Link>
          </Button>
        </div>
      </StorefrontLayout>
    );
  }

  const cyclePrice =
    product.pricing.find((pr) => pr.cycle === selectedCycle) || product.pricing[0];
  const unitPrice = cyclePrice ? cyclePrice.price : 0;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const subtotal = unitPrice + (product.setupFee || 0) + addonsTotal;

  function toggleAddon(addon: { name: string; price: number }) {
    setSelectedAddons((prev) =>
      prev.some((a) => a.name === addon.name)
        ? prev.filter((a) => a.name !== addon.name)
        : [...prev, addon]
    );
  }

  function handleAddToCart() {
    if (!product) return;
    try {
      setState((prev) =>
        workflows.addToCart(prev, {
          productId: product.id,
          productName: product.name,
          productType: product.type,
          billingCycle: selectedCycle,
          unitPrice,
          setupFee: product.setupFee || 0,
          quantity: 1,
          selectedAddons,
        })
      );
      toast.success(`"${product.name}" added to shopping cart!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add product to cart');
    }
  }

  function handleInstantCheckout() {
    handleAddToCart();
    router.push('/storefront/cart');
  }

  const relatedProducts = state.products
    .filter((p) => p.available && p.id !== product.id && p.type === product.type)
    .slice(0, 2);

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/storefront" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/storefront/hosting" className="hover:text-slate-900 transition-colors">
              Hosting
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-900">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
            {/* Left Column: Product Summary & Specs */}
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-xs">
                    {product.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  {product.available ? (
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs">
                      Available for Instant Provisioning
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  {product.name}
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">{product.description}</p>
              </div>

              {/* Resource Limit Specs Table */}
              <Card className="border border-slate-200 bg-white shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Allocated Resource Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-slate-100 text-xs">
                  {product.resourceLimits.map((limit, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">{limit.label}</span>
                      <span className="font-bold text-slate-900">{limit.value}</span>
                    </div>
                  ))}
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">SSL Certificate</span>
                    <span className="font-bold text-emerald-600">Automated Free TLS</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Automated Backups</span>
                    <span className="font-bold text-slate-900">Daily Snapshots (30-day retention)</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Execution Isolation</span>
                    <span className="font-bold text-slate-900">Dedicated Container cgroup</span>
                  </div>
                </CardContent>
              </Card>

              {/* Addons Selection */}
              {product.addons && product.addons.length > 0 && (
                <Card className="border border-slate-200 bg-white shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Available Plan Add-ons
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {product.addons.map((addon, idx) => {
                      const isChecked = selectedAddons.some((a) => a.name === addon.name);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleAddon(addon)}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-blue-500 bg-blue-50/40'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox checked={isChecked} onCheckedChange={() => toggleAddon(addon)} />
                            <span className="text-xs font-semibold text-slate-800">{addon.name}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-900">
                            +{formatCurrency(addon.price)}/mo
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Product FAQ */}
              <div className="space-y-4 pt-4">
                <h3 className="font-bold text-lg text-slate-900">Frequently Asked Questions</h3>
                <div className="space-y-3 text-xs text-slate-600">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
                    <div className="font-bold text-slate-900">Can I upgrade to a higher tier later?</div>
                    <div>Yes. Upgrades can be requested from the customer portal at prorated billing.</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
                    <div className="font-bold text-slate-900">Do I need technical server knowledge?</div>
                    <div>
                      Shared and managed hosting packages feature automated control panels and 1-click script installers.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Pricing & Checkout Card */}
            <div className="lg:col-span-4 sticky top-24 space-y-6">
              <Card className="border border-slate-200 bg-white shadow-md">
                <CardHeader className="space-y-2 pb-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Order Configuration
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-950">
                      {formatCurrency(subtotal)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      /{selectedCycle === 'annually' ? 'year' : 'month'}
                    </span>
                  </div>
                  {product.setupFee > 0 ? (
                    <div className="text-[11px] text-slate-500">
                      Includes {formatCurrency(product.setupFee)} setup fee
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-600 font-medium">Zero setup fee</div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">Choose Billing Interval</label>
                    <div className="space-y-2">
                      {product.pricing.map((pr) => (
                        <div
                          key={pr.cycle}
                          onClick={() => setSelectedCycle(pr.cycle)}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedCycle === pr.cycle
                              ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-3 w-3 rounded-full border flex items-center justify-center ${
                                selectedCycle === pr.cycle ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                              }`}
                            />
                            <span className="text-xs font-semibold capitalize text-slate-800">
                              {pr.cycle.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-900">{formatCurrency(pr.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedAddons.length > 0 && (
                    <div className="rounded-lg bg-slate-50 p-2.5 text-xs space-y-1">
                      <div className="font-semibold text-slate-700">Selected Add-ons:</div>
                      {selectedAddons.map((a) => (
                        <div key={a.name} className="flex justify-between text-slate-600 text-[11px]">
                          <span>{a.name}</span>
                          <span>+{formatCurrency(a.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <Button
                    onClick={handleInstantCheckout}
                    className="w-full text-white font-semibold text-xs h-10 shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Proceed to Cart & Checkout <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleAddToCart}
                    className="w-full text-xs gap-1.5 h-9 bg-white"
                  >
                    <ShoppingCart className="h-3.5 w-3.5 text-slate-600" />
                    Add to Shopping Cart
                  </Button>
                </CardFooter>
              </Card>

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Related Packages
                  </div>
                  {relatedProducts.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/storefront/hosting/${rel.id}`}
                      className="block p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all text-xs space-y-1 shadow-xs"
                    >
                      <div className="font-bold text-slate-900 flex justify-between">
                        <span>{rel.name}</span>
                        <span className="text-blue-600">
                          {formatCurrency(rel.pricing[0]?.price || 0)}/mo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{rel.description}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
