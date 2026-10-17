'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Server,
  Globe,
  Tag,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/demo/selectors';
import * as workflows from '@/lib/demo/workflows';
import type { BillingCycle } from '@/lib/demo/types';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function StorefrontCartPage() {
  const router = useRouter();
  const { state, setState } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const cart = Array.isArray(state.cart) ? state.cart : [];
  const taxRate = state.business.taxRate || 0;
  const { subtotal, taxAmount, total, itemCount } = workflows.calculateCartTotals(cart, taxRate);

  function handleRemove(id: string) {
    setState((prev) => workflows.removeFromCart(prev, id));
    toast.info('Item removed from cart.');
  }

  function handleUpdateCycle(id: string, cycle: BillingCycle) {
    try {
      setState((prev) => workflows.updateCartItemCycle(prev, id, cycle));
    } catch (err: any) {
      toast.error(err.message || 'Cannot select this billing cycle.');
    }
  }

  function handleUpdateQuantity(id: string, quantity: number) {
    setState((prev) => workflows.updateCartItemQuantity(prev, id, quantity));
  }

  function handleClearCart() {
    setState((prev) => workflows.clearCart(prev));
    toast.info('Shopping cart cleared.');
  }

  function handleProceedToCheckout() {
    if (cart.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    router.push('/storefront/checkout');
  }

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                <ShoppingCart className="h-7 w-7 text-blue-600" />
                Shopping Cart
                <Badge variant="outline" className="text-xs">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Review your selected hosting plans, server add-ons, and domain registrations.
              </p>
            </div>

            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearCart} className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 self-start sm:self-auto">
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear Cart
              </Button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4 max-w-xl mx-auto">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-900">Your cart is currently empty</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Explore our hosting packages, Cloud VPS configurations, or register a new domain name to add to your order.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button asChild size="sm" className="text-xs text-white" style={{ backgroundColor: primaryColor }}>
                  <Link href="/storefront/hosting">Browse Hosting</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="text-xs bg-white">
                  <Link href="/storefront/domains">Search Domains</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
              {/* Cart Items List */}
              <div className="lg:col-span-8 space-y-4">
                {cart.map((item) => {
                  const product = state.products.find((p) => p.id === item.productId);
                  const availableCycles = product?.pricing || [{ cycle: item.billingCycle, price: item.unitPrice }];
                  const addonsSum = (item.selectedAddons || []).reduce((acc, a) => acc + a.price, 0);
                  const itemLineTotal = (item.unitPrice * item.quantity) + (item.setupFee || 0) + (addonsSum * item.quantity);

                  return (
                    <Card key={item.id} className="border border-slate-200 bg-white shadow-xs overflow-hidden">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-slate-900">{item.productName}</h3>
                              <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                                {item.productType.replace('_', ' ')}
                              </Badge>
                            </div>
                            {item.domainName && (
                              <div className="flex items-center gap-1.5 text-xs text-blue-700 font-medium">
                                <Globe className="h-3.5 w-3.5" />
                                <span>Attached Domain: {item.domainName}</span>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-extrabold text-slate-950">
                              {formatCurrency(itemLineTotal)}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {formatCurrency(item.unitPrice)}/{item.billingCycle.replace('_', ' ')}
                            </div>
                          </div>
                        </div>

                        {/* Addons display */}
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <div className="rounded-lg bg-slate-50 p-2.5 text-xs space-y-1">
                            <span className="font-semibold text-slate-600">Selected Add-ons:</span>
                            {item.selectedAddons.map((addon) => (
                              <div key={addon.name} className="flex justify-between text-slate-500 text-[11px]">
                                <span>+ {addon.name}</span>
                                <span>{formatCurrency(addon.price)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Item controls: Cycle selector, quantity, remove */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">Billing:</span>
                              <Select
                                value={item.billingCycle}
                                onValueChange={(val) => handleUpdateCycle(item.id, val as BillingCycle)}
                              >
                                <SelectTrigger className="h-8 text-xs w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableCycles.map((pr) => (
                                    <SelectItem key={pr.cycle} value={pr.cycle} className="text-xs">
                                      {pr.cycle.replace('_', ' ')} ({formatCurrency(pr.price)})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">Qty:</span>
                              <div className="flex items-center rounded-lg border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  className="px-2 py-1 hover:bg-slate-100 text-slate-600"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-2 text-xs font-semibold">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                  className="px-2 py-1 hover:bg-slate-100 text-slate-600"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(item.id)}
                            className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Order Summary & Payment Button */}
              <div className="lg:col-span-4 sticky top-24 space-y-4">
                <Card className="border border-slate-200 bg-white shadow-md">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-base font-bold text-slate-900">Order Summary</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-4 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Estimated Tax ({taxRate}%)</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(taxAmount)}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Automated Setup</span>
                      <span className="font-semibold text-emerald-600">Free / Zero Cost</span>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                      <span className="font-bold text-sm text-slate-900">Total Due Today</span>
                      <span className="font-extrabold text-2xl text-slate-950">
                        {formatCurrency(total)}
                      </span>
                    </div>

                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] text-emerald-800 space-y-1">
                      <div className="font-semibold">Secure Order Protection</div>
                      <div>256-bit SSL encrypted checkout. Automated service provisioning and invoice creation.</div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                    <Button
                      asChild
                      className="w-full text-white font-semibold text-xs h-11 shadow-md hover:opacity-95"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Link href="/storefront/checkout">
                        Proceed to Checkout <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    </Button>

                    <Button asChild variant="ghost" size="sm" className="w-full text-xs text-slate-600">
                      <Link href="/storefront/hosting">Continue Shopping</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  );
}
