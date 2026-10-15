'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Server,
  Globe,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import { formatCurrency } from '@/lib/demo/selectors';
import type { BillingCycle, Product, Order, Invoice, Service, DemoState } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, setState } = useDemo();

  const productIdParam = searchParams.get('productId') || state.products[0]?.id;
  const cycleParam = (searchParams.get('cycle') as BillingCycle) || 'monthly';
  const domainParam = searchParams.get('domain') || '';

  const [selectedProductId, setSelectedProductId] = useState(productIdParam);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(cycleParam);
  const [domainName, setDomainName] = useState(domainParam);

  // Customer selection / creation
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('new');
  const [selectedCustomerId, setSelectedCustomerId] = useState(state.customers[0]?.id || '');
  const [newCustomerName, setNewCustomerName] = useState('Alex Mercer');
  const [newCustomerEmail, setNewCustomerEmail] = useState('alex.mercer@innovatetech.io');
  const [newCustomerCompany, setNewCustomerCompany] = useState('InnovateTech Solutions');
  const [newCustomerCountry, setNewCustomerCountry] = useState('United States');

  // Checkout flow states: 'review' -> 'processing_payment' -> 'provisioning' -> 'completed'
  const [stage, setStage] = useState<'review' | 'payment_ready' | 'provisioning' | 'completed'>('review');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card (Simulated)');

  // Completed results
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [createdService, setCreatedService] = useState<Service | null>(null);
  const [provisioningStep, setProvisioningStep] = useState(0);
  const [simulatedError, setSimulatedError] = useState<string | null>(null);

  const product = state.products.find((p) => p.id === selectedProductId) || state.products[0];

  const cartParam = searchParams.get('cart') === 'true';
  const hasCartItems = (state.cart?.length || 0) > 0;
  const isCartMode = (cartParam || (!searchParams.get('productId') && hasCartItems)) && hasCartItems;
  const cartTotals = workflows.calculateCartTotals(state.cart || [], state.business.taxRate);

  useEffect(() => {
    if (productIdParam) setSelectedProductId(productIdParam);
    if (cycleParam) setSelectedCycle(cycleParam);
    if (domainParam) setDomainName(domainParam);
  }, [productIdParam, cycleParam, domainParam]);

  if (!product && !isCartMode) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold">No products available for checkout</h2>
        <Button asChild className="mt-4">
          <Link href="/demo/storefront-preview">Return to Storefront</Link>
        </Button>
      </div>
    );
  }

  const { unitPrice, subtotal, taxAmount, total } = workflows.calculateOrderPrice(
    product || state.products[0],
    selectedCycle,
    state.business.taxRate
  );

  const effectiveSubtotal = isCartMode ? cartTotals.subtotal : subtotal;
  const effectiveTaxAmount = isCartMode ? cartTotals.taxAmount : taxAmount;
  const effectiveTotal = isCartMode ? cartTotals.total : total;

  function handleConfirmOrder() {
    let nextState = state;
    let customerIdToUse = selectedCustomerId;

    // Create customer first if new mode
    if (customerMode === 'new') {
      if (!newCustomerName.trim()) {
        toast.error('Please enter customer full name.');
        return;
      }
      if (!workflows.isValidEmail(newCustomerEmail)) {
        toast.error('Please enter a valid customer email address.');
        return;
      }

      // Check if email already exists
      const existing = nextState.customers.find((c) => c.email.toLowerCase() === newCustomerEmail.toLowerCase());
      if (existing) {
        customerIdToUse = existing.id;
      } else {
        try {
          nextState = workflows.createCustomer(nextState, {
            name: newCustomerName,
            email: newCustomerEmail,
            company: newCustomerCompany,
            country: newCustomerCountry,
          });
          const created = nextState.customers.find((c) => c.email.toLowerCase() === newCustomerEmail.toLowerCase())!;
          customerIdToUse = created.id;
        } catch (err: any) {
          toast.error(err.message || 'Failed to create customer');
          return;
        }
      }
    }

    if (isCartMode) {
      try {
        const result = workflows.checkoutCart(nextState, {
          customerId: customerIdToUse,
          paymentMethod,
        });
        nextState = result.state;
        const primaryOrder = result.orders[0];
        setCreatedOrder(primaryOrder || null);
        setCreatedInvoice(result.invoice);
        setState(() => nextState);

        if (primaryOrder) {
          toast.success(`Order ${primaryOrder.orderNumber} placed & payment authorized!`);
        }

        if (result.services.length > 0 && primaryOrder) {
          setCreatedService(result.services[0]);
          setStage('provisioning');
          runProvisioningAnimation(primaryOrder.id, nextState);
        } else {
          setStage('completed');
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to place order');
      }
      return;
    }

    try {
      // Create order and invoice with simulated payment immediately
      const result = workflows.createOrderWithInvoice(nextState, {
        customerId: customerIdToUse,
        productId: product.id,
        billingCycle: selectedCycle,
        domainName: domainName.trim() || null,
        simulatePaymentImmediately: true,
        paymentMethod,
      });

      nextState = result.state;
      setCreatedOrder(result.order);
      setCreatedInvoice(result.invoice);
      setState(() => nextState);

      toast.success(`Order ${result.order.orderNumber} placed & payment authorized!`);

      // If hosting product, advance directly into interactive provisioning simulation
      if (product.type !== 'domain_registration') {
        setStage('provisioning');
        runProvisioningAnimation(result.order.id, nextState);
      } else {
        // If domain registration, lead into domain workflow
        workflows.purchaseDomainSimulation(nextState, {
          customerId: customerIdToUse,
          domain: domainName || 'mydemo-domain.com',
          price: product.pricing[0]?.price || 14.99,
          simulatePayment: true,
        });
        setStage('completed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    }
  }

  function runProvisioningAnimation(orderId: string, currentState: DemoState) {
    setProvisioningStep(1);
    setTimeout(() => {
      setProvisioningStep(2);
      setTimeout(() => {
        setProvisioningStep(3);
        setTimeout(() => {
          setProvisioningStep(4);
          try {
            const provRes = workflows.simulateProvisioning(currentState, {
              orderId,
              domainName: domainName || undefined,
              forceFailure: false,
            });
            setState(() => provRes.state);
            setCreatedService(provRes.service || null);
            setStage('completed');
            toast.success('Hosting service provisioned and active!');
          } catch (err: any) {
            setSimulatedError(err.message);
          }
        }, 600);
      }, 600);
    }, 600);
  }

  function handleTriggerProvisioningFailure() {
    if (!createdOrder) return;
    setSimulatedError('Upstream hypervisor node capacity limit exceeded in us-east-1');
    const failureRes = workflows.simulateProvisioning(state, {
      orderId: createdOrder.id,
      forceFailure: true,
      failureReason: 'Upstream hypervisor node capacity limit exceeded in us-east-1',
    });
    setState(() => failureRes.state);
    toast.error('Simulated operational failure triggered');
  }

  function handleRetryProvisioning() {
    if (!createdOrder) return;
    setSimulatedError(null);
    runProvisioningAnimation(createdOrder.id, state);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Simulated Customer Checkout
              </Badge>
              <span className="text-xs text-slate-500">
                Merchant: <strong>{state.storefront.businessName}</strong>
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Complete Your Order
            </h1>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/demo/storefront-preview">
              &larr; Back to Storefront
            </Link>
          </Button>
        </div>

        {/* STAGE 1 & 2: Review & Payment Confirmation */}
        {stage !== 'completed' && stage !== 'provisioning' && (
          <div className="grid gap-6 md:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {/* Product and Cycle Confirmation or Cart Breakdown */}
              {isCartMode ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>1. Shopping Cart Items ({(state.cart || []).length})</span>
                      <Badge variant="secondary">Multi-Item Checkout</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(state.cart || []).map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                        <div>
                          <div className="font-semibold text-slate-900">{item.productName} × {item.quantity}</div>
                          <div className="text-[11px] text-slate-500 capitalize">
                            {item.billingCycle.replace(/_/g, ' ')}{item.domainName ? ` • ${item.domainName}` : ''}
                          </div>
                        </div>
                        <div className="font-medium text-slate-900">
                          {formatCurrency(item.unitPrice * item.quantity, state.business.currency)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>1. Selected Service & Billing Cycle</span>
                      <Badge variant="secondary" className="capitalize">
                        {product.type.replace(/_/g, ' ')}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Package</Label>
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {state.products.filter((p) => p.available).map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Billing Interval</Label>
                      <Select
                        value={selectedCycle}
                        onValueChange={(v) => setSelectedCycle(v as BillingCycle)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="annually">Annually (Best Value)</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Primary Domain Name</Label>
                    <Input
                      placeholder="e.g. mycompanywebsite.com"
                      value={domainName}
                      onChange={(e) => setDomainName(e.target.value)}
                    />
                    <span className="text-[11px] text-slate-500">
                      Enter the domain you want attached to this hosting environment.
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

              {/* Customer Contact Details */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">2. Customer Account Information</CardTitle>
                    <div className="flex rounded-md border p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setCustomerMode('new')}
                        className={`rounded px-2.5 py-1 ${
                          customerMode === 'new'
                            ? 'bg-slate-900 text-white font-medium'
                            : 'text-slate-600'
                        }`}
                      >
                        New Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomerMode('existing')}
                        className={`rounded px-2.5 py-1 ${
                          customerMode === 'existing'
                            ? 'bg-slate-900 text-white font-medium'
                            : 'text-slate-600'
                        }`}
                      >
                        Existing Demo Customer
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customerMode === 'existing' ? (
                    <div className="space-y-2">
                      <Label className="text-xs">Select Customer Profile</Label>
                      <Select
                        value={selectedCustomerId}
                        onValueChange={setSelectedCustomerId}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {state.customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} ({c.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Full Name *</Label>
                          <Input
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Email Address *</Label>
                          <Input
                            type="email"
                            value={newCustomerEmail}
                            onChange={(e) => setNewCustomerEmail(e.target.value)}
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Company Name (Optional)</Label>
                          <Input
                            value={newCustomerCompany}
                            onChange={(e) => setNewCustomerCompany(e.target.value)}
                            placeholder="Acme Corp"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Country</Label>
                          <Input
                            value={newCustomerCountry}
                            onChange={(e) => setNewCustomerCountry(e.target.value)}
                            placeholder="United States"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Explicit Simulated Payment Step */}
              <Card className="border-indigo-200 bg-indigo-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-indigo-950">
                    <CreditCard className="h-4 w-4 text-indigo-600" /> 3. Simulated Payment Authorization
                  </CardTitle>
                  <CardDescription className="text-xs text-indigo-800">
                    Simulate customer checkout. No real money or payment gateway charges are made.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-3 text-xs">
                    {[
                      { id: 'Credit Card (Simulated)', label: 'Test Credit Card', desc: 'Instant authorization' },
                      { id: 'PayPal (Simulated)', label: 'PayPal Checkout', desc: 'Simulated agreement' },
                      { id: 'Bank Transfer (Simulated)', label: 'Direct Bank Wire', desc: 'Wire reconciliation' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`rounded-lg border p-3 text-left transition-all ${
                          paymentMethod === m.id
                            ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/20 text-indigo-950 font-medium'
                            : 'border-slate-200 bg-white/60 hover:bg-white text-slate-700'
                        }`}
                      >
                        <div>{m.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{m.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-lg border border-indigo-200 bg-white p-3 text-xs text-slate-600 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-indigo-600" /> Authorization amount:{' '}
                      <strong className="text-slate-900 font-bold">{formatCurrency(effectiveTotal, state.business.currency)}</strong>
                    </span>
                    <Badge variant="outline" className="border-indigo-300 text-indigo-700 text-[10px]">
                      Test Mode
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    onClick={handleConfirmOrder}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                  >
                    Confirm & Authorize Simulated Payment ({formatCurrency(effectiveTotal, state.business.currency)})
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Sidebar Summary */}
            <div>
              <Card className="sticky top-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {isCartMode ? (
                    <>
                      {(state.cart || []).map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span className="font-medium text-slate-700 truncate max-w-[180px]">
                            {item.productName} × {item.quantity}
                          </span>
                          <span>{formatCurrency(item.unitPrice * item.quantity, state.business.currency)}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-700">{product.name}</span>
                        <span>{formatCurrency(unitPrice, state.business.currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Cycle</span>
                        <span className="capitalize">{selectedCycle.replace(/_/g, ' ')}</span>
                      </div>
                      {product.setupFee > 0 && (
                        <div className="flex justify-between text-slate-500">
                          <span>Setup Fee</span>
                          <span>{formatCurrency(product.setupFee, state.business.currency)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(effectiveSubtotal, state.business.currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({state.business.taxRate}%)</span>
                    <span>{formatCurrency(effectiveTaxAmount, state.business.currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm font-bold text-slate-950">
                    <span>Total Due</span>
                    <span>{formatCurrency(effectiveTotal, state.business.currency)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* STAGE 3: Live Provisioning Simulation Animation */}
        {stage === 'provisioning' && (
          <Card className="max-w-xl mx-auto border-indigo-200">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-2">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <CardTitle className="text-xl">Automated Service Provisioning</CardTitle>
              <CardDescription>
                Allocating container & dedicated resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2.5">
                {[
                  { step: 1, label: 'Allocating cPanel/WHM Hypervisor Node...' },
                  { step: 2, label: 'Creating Linux cgroup container and quotas...' },
                  { step: 3, label: 'Configuring authoritative DNS zone records...' },
                  { step: 4, label: 'Deploying Let’s Encrypt auto-SSL certificate...' },
                ].map((s) => (
                  <div
                    key={s.step}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-xs transition-colors ${
                      provisioningStep >= s.step
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 font-medium'
                        : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    {provisioningStep > s.step ? (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : provisioningStep === s.step ? (
                      <Loader2 className="h-4 w-4 text-indigo-600 animate-spin shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0 text-center text-[10px]">
                        {s.step}
                      </div>
                    )}
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>

              {simulatedError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 space-y-2">
                  <div className="font-semibold flex items-center gap-1.5 text-rose-700">
                    <AlertCircle className="h-4 w-4" /> Provisioning Operation Failed
                  </div>
                  <p>{simulatedError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRetryProvisioning}
                    className="border-rose-300 text-rose-800 hover:bg-rose-100"
                  >
                    Retry Provisioning Job
                  </Button>
                </div>
              )}
            </CardContent>
            {!simulatedError && (
              <CardFooter className="justify-center border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTriggerProvisioningFailure}
                  className="text-xs text-slate-500 hover:text-rose-600"
                >
                  Demonstrate Controlled Operational Failure & Retry
                </Button>
              </CardFooter>
            )}
          </Card>
        )}

        {/* STAGE 4: Completed Order & Next Steps */}
        {stage === 'completed' && createdOrder && (
          <Card className="max-w-2xl mx-auto border-emerald-200 shadow-md">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl text-slate-950">Service Active & Ready</CardTitle>
              <CardDescription>
                Your customer order has been processed, the invoice marked paid, and the service activated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-slate-50 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Number:</span>
                  <span className="font-mono font-semibold text-slate-900">{createdOrder.orderNumber}</span>
                </div>
                {createdInvoice && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice Number:</span>
                    <span className="font-mono font-semibold text-slate-900">{createdInvoice.invoiceNumber} (Paid)</span>
                  </div>
                )}
                {createdService && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Server:</span>
                      <span className="font-mono text-slate-900">{createdService.serverHostname}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Allocated IP:</span>
                      <span className="font-mono text-slate-900">{createdService.ipAddress}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t pt-2 text-sm font-bold">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(createdOrder.amount, state.business.currency)}</span>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 pt-2">
                <Button size="sm" asChild className="w-full">
                  <Link href="/demo/services">
                    View in Dashboard <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="w-full">
                  <Link href="/demo/orders">
                    View in Orders
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="w-full">
                  <Link href="/demo/invoices">
                    View Invoices
                  </Link>
                </Button>
              </div>
            </CardContent>
            <CardFooter className="justify-center border-t bg-slate-50/50 py-3">
              <Link
                href="/demo/storefront-preview"
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Return to Storefront Catalog
              </Link>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
