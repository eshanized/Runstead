'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Lock,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import { formatCurrency } from '@/lib/demo/selectors';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function DomainTransferPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-500">Loading transfer portal...</div>}>
      <DomainTransferContent />
    </Suspense>
  );
}

function DomainTransferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDomain = searchParams.get('domain') || '';

  const { state, setState } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [domainName, setDomainName] = useState(initialDomain);
  const [authCode, setAuthCode] = useState('EPP-992384-AUTH');
  const [keepDns, setKeepDns] = useState(true);
  const [transferStatus, setTransferStatus] = useState<string | null>(null);

  function handleVerifyDomain(e: React.FormEvent) {
    e.preventDefault();
    const valid = workflows.isValidDomain(domainName);
    if (!valid.valid) {
      toast.error(valid.error || 'Please enter a valid registrable domain name.');
      return;
    }
    setStep(2);
    toast.success(`Domain "${domainName}" validated for transfer!`);
  }

  function handleAuthorizeTransfer() {
    if (!authCode.trim()) {
      toast.error('Please enter the EPP Authorization code provided by your current registrar.');
      return;
    }

    // Add domain transfer to cart as domain registration product
    const domainProduct = state.products.find((p) => p.type === 'domain_registration') || state.products[0];
    try {
      setState((prev) =>
        workflows.addToCart(prev, {
          productId: domainProduct.id,
          productName: `Domain Transfer (${domainName})`,
          productType: 'domain_registration',
          billingCycle: 'annually',
          unitPrice: 12.99,
          setupFee: 0,
          domainName,
          quantity: 1,
          selectedAddons: [],
        })
      );

      setStep(3);
      toast.success('Simulated domain transfer request registered!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to process transfer request');
    }
  }

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
              Registrar Transfer Assistant
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Transfer Your Domain to {config.businessName}
            </h1>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Migrate domain management, DNS routing, and automated renewal under one unified dashboard without website downtime.
            </p>
          </div>

          {/* Stepper indicator */}
          <div className="flex items-center justify-center gap-3 text-xs font-semibold">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${step >= 1 ? 'bg-blue-600' : 'bg-slate-300'}`}>1</span>
              <span>Verify Domain</span>
            </div>
            <span className="text-slate-300">———</span>
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${step >= 2 ? 'bg-blue-600' : 'bg-slate-300'}`}>2</span>
              <span>Auth & Settings</span>
            </div>
            <span className="text-slate-300">———</span>
            <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-300'}`}>3</span>
              <span>Checkout</span>
            </div>
          </div>

          {/* Step 1: Verification Form */}
          {step === 1 && (
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900">Step 1: Enter Domain for Transfer</CardTitle>
                <CardDescription className="text-xs">
                  Ensure the domain is unlocked at your current registrar and WHOIS privacy is temporarily disabled if required.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleVerifyDomain}>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="domainName" className="text-xs font-semibold text-slate-700">Domain Name</Label>
                    <Input
                      id="domainName"
                      placeholder="e.g. my-existing-site.com"
                      value={domainName}
                      onChange={(e) => setDomainName(e.target.value)}
                      className="text-xs h-10"
                      required
                    />
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 text-slate-500 space-y-1 text-[11px]">
                    <div className="font-semibold text-slate-700">Transfer Prerequisites Checklist:</div>
                    <div>✓ Domain must be registered for at least 60 days.</div>
                    <div>✓ Domain status must be unlocked (ClientTransferProhibited removed).</div>
                    <div>✓ You must have access to the administrative email or EPP authorization code.</div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t border-slate-100 flex justify-end">
                  <Button type="submit" className="text-xs text-white font-semibold h-9 px-5" style={{ backgroundColor: primaryColor }}>
                    Verify Transfer Eligibility <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Step 2: EPP Code & DNS options */}
          {step === 2 && (
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900">Step 2: Enter EPP Authorization Code</CardTitle>
                <CardDescription className="text-xs">
                  Transferring <strong>{domainName}</strong> includes a 1-year registration renewal extension.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label htmlFor="authCode" className="text-xs font-semibold text-slate-700">EPP / Auth-Code</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="authCode"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      className="pl-9 text-xs h-10 font-mono"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Obtained from your current registrar control panel.</p>
                </div>

                <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <div className="font-semibold text-slate-800">Nameserver & DNS Preference:</div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dnsChoice"
                      checked={keepDns}
                      onChange={() => setKeepDns(true)}
                      className="text-blue-600"
                    />
                    <span>Keep current nameservers (zero DNS downtime)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dnsChoice"
                      checked={!keepDns}
                      onChange={() => setKeepDns(false)}
                      className="text-blue-600"
                    />
                    <span>Switch to our Anycast Cloud Nameservers</span>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-xs">
                  <span className="font-semibold text-blue-950">Transfer Fee (includes 1-yr extension):</span>
                  <span className="font-bold text-blue-900 text-sm">$12.99 USD</span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t border-slate-100 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
                  Back
                </Button>
                <Button
                  onClick={handleAuthorizeTransfer}
                  className="text-xs text-white font-semibold h-9 px-5"
                  style={{ backgroundColor: primaryColor }}
                >
                  Authorize Transfer & Add to Cart <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 3: Success Confirmation */}
          {step === 3 && (
            <Card className="border border-emerald-200 bg-emerald-50/40 shadow-xs text-center p-8 space-y-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Transfer Request Queued!</h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Domain transfer for <strong>{domainName}</strong> has been configured with the provided EPP key and added to your shopping cart.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild className="text-xs text-white font-semibold h-10 px-6" style={{ backgroundColor: primaryColor }}>
                  <Link href="/demo/storefront-preview/cart">
                    Review Cart & Complete Order <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="text-xs bg-white h-10 px-6">
                  <Link href="/demo/storefront-preview/domains">
                    Search More Domains
                  </Link>
                </Button>
              </div>

              <p className="text-[11px] text-slate-400 pt-2">
                Simulated domain transfer for investor demonstration. In production, an automated EPP transfer handshake is initiated.
              </p>
            </Card>
          )}
        </div>
      </div>
    </StorefrontLayout>
  );
}
