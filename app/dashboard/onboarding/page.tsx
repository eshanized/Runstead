'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Rocket,
  Check,
  ArrowRight,
  ArrowLeft,
  Store,
  Palette,
  Package,
  DollarSign,
  Eye,
  PartyPopper,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useDemo } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import type { StorefrontSettings } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/demo/selectors';

const steps = ['Profile', 'Category', 'Branding', 'Products', 'Pricing', 'Preview', 'Launch'];
const stepIcons = [Store, Store, Palette, Package, DollarSign, Eye, Rocket];

export default function OnboardingPage() {
  return (
    <DashboardShell>
      <OnboardingContent />
    </DashboardShell>
  );
}

function OnboardingContent() {
  const { state, setState } = useDemo();
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>(Array(steps.length).fill(false));

  // Form state initialized with saved state values
  const [businessName, setBusinessName] = useState(state.business.businessName || 'Veloce Cloud Hosting');
  const [tagline, setTagline] = useState(state.storefront.tagline || 'Reliable hosting for everyone');
  const [description, setDescription] = useState(state.storefront.description || 'Premium cloud hosting with 24/7 dedicated support.');
  const [category, setCategory] = useState(state.business.category || 'agency');
  const [primaryColor, setPrimaryColor] = useState(state.storefront.primaryColor || '#0f5fff');
  const [accentColor, setAccentColor] = useState(state.storefront.accentColor || '#00c896');
  const [logoText, setLogoText] = useState(state.storefront.logoText || 'VC');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    state.storefront.displayedProductIds.length > 0
      ? state.storefront.displayedProductIds
      : ['prod_001', 'prod_002', 'prod_003']
  );
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [email, setEmail] = useState(state.business.email || 'admin@velocecloud.host');
  const [phone, setPhone] = useState(state.business.phone || '+1 888 555 0100');
  const [headline, setHeadline] = useState(state.storefront.headline || 'Host smarter. Scale faster.');

  const progress = ((step + 1) / steps.length) * 100;

  function validateStep(): boolean {
    if (step === 0) {
      if (!businessName.trim()) {
        toast.error('Business Name is required.');
        return false;
      }
      if (!email.trim() || !workflows.isValidEmail(email)) {
        toast.error('A valid contact email is required.');
        return false;
      }
    }
    if (step === 1) {
      if (!category) {
        toast.error('Please select a business category.');
        return false;
      }
    }
    if (step === 2) {
      if (!headline.trim()) {
        toast.error('Storefront headline is required.');
        return false;
      }
    }
    if (step === 3) {
      if (selectedProductIds.length === 0) {
        toast.error('Please select at least one product to showcase.');
        return false;
      }
    }
    if (step === 4) {
      for (const pid of selectedProductIds) {
        const pr = customPrices[pid];
        if (pr !== undefined && (isNaN(pr) || pr <= 0)) {
          toast.error('Product price must be a positive number.');
          return false;
        }
      }
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    setCompleted((prev) => prev.map((c, i) => (i === step ? true : c)));
    if (step < steps.length - 1) setStep(step + 1);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  function finish() {
    if (!validateStep()) return;

    try {
      setState((prev) =>
        workflows.launchSaaSTenant(prev, {
          planName: prev.business.currentPlan || 'Growth',
          billingInterval: 'monthly',
          businessName,
          category,
          email,
          phone,
          headline,
          logoText,
          primaryColor,
          accentColor,
          customPrices,
        })
      );

      setCompleted((prev) => prev.map(() => true));
      setStep(steps.length - 1);
      toast.success('Onboarding complete! Your demo hosting business is ready.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete onboarding');
    }
  }

  const selectedProducts = state.products.filter((p) => selectedProductIds.includes(p.id));

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Rocket className="h-6 w-6 text-accent" /> Onboarding Wizard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up your hosting business step by step with synchronized pricing and branding.
        </p>
      </div>

      <Progress value={progress} className="h-2 mb-2" />
      <div className="mb-6 flex justify-between text-xs text-muted-foreground">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`flex items-center gap-1 ${
              i <= step ? 'text-foreground font-medium' : ''
            }`}
          >
            {completed[i] && <Check className="h-3 w-3 text-success" />}
            {s}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">1. Business Profile</h2>
              <div className="space-y-2">
                <Label htmlFor="bizName">Business Name *</Label>
                <Input
                  id="bizName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Acme Hosting"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Reliable hosting for everyone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell customers what makes your hosting special..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@acme.host"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Support Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 888 555 0100"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">2. Business Category</h2>
              <p className="text-sm text-muted-foreground">
                This helps configure default products, pricing, and client onboarding workflows.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: 'freelancer', label: 'Freelancer / Developer', desc: 'Hosting a few client sites' },
                  { value: 'agency', label: 'Web Agency', desc: 'Managing many client accounts & retainers' },
                  { value: 'entrepreneur', label: 'Hosting Entrepreneur', desc: 'Starting a new commercial hosting brand' },
                  { value: 'existing', label: 'Existing Hosting Company', desc: 'Migrating from WHMCS or legacy platform' },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      category === cat.value ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'hover:border-border'
                    }`}
                  >
                    <div className="font-medium text-sm">{cat.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">3. Branding & Theme</h2>
              <div className="space-y-2">
                <Label htmlFor="logoText">Logo Monogram (2-3 characters)</Label>
                <Input
                  id="logoText"
                  maxLength={3}
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value.toUpperCase())}
                  placeholder="AH"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headline">Storefront Headline *</Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Host smarter. Scale faster."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Brand Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Button Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-10 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Theme Preview */}
              <div className="rounded-lg border p-4 bg-muted/20">
                <span className="text-xs text-muted-foreground font-semibold block mb-2 uppercase">Preview Header</span>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {logoText || 'AH'}
                  </span>
                  <span className="font-bold text-sm text-foreground">{businessName || 'Acme Hosting'}</span>
                </div>
                <p className="text-xs text-muted-foreground">{headline || 'Host smarter. Scale faster.'}</p>
                <button
                  type="button"
                  className="mt-3 rounded px-3 py-1.5 text-xs text-white shadow-sm font-medium"
                  style={{ backgroundColor: accentColor }}
                >
                  Order Hosting
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">4. Select Products to Sell</h2>
              <p className="text-sm text-muted-foreground">
                Choose which packages appear on your public white-label storefront.
              </p>
              <div className="space-y-2">
                {state.products
                  .filter((p) => p.type !== 'add_on')
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                    >
                      <Switch
                        checked={selectedProductIds.includes(p.id)}
                        onCheckedChange={() => toggleProduct(p.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.description}</div>
                      </div>
                      <Badge variant="secondary">
                        {p.pricing[0] && formatCurrency(p.pricing[0].price, state.business.currency)}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">5. Set Your Selling Prices</h2>
              <p className="text-sm text-muted-foreground">
                Customize monthly retail prices for your customers in{' '}
                <strong className="text-foreground">{state.business.currency}</strong>. These prices persist directly to
                your live catalog and storefront preview.
              </p>
              {selectedProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No products selected. Please go back.</p>
              ) : (
                <div className="space-y-3">
                  {selectedProducts.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">{p.name}</Label>
                        <span className="text-xs text-muted-foreground block">
                          Base cycle: {p.pricing[0]?.cycle.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">{state.business.currency}</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.5"
                          className="w-28 text-right font-mono"
                          value={customPrices[p.id] ?? p.pricing[0]?.price ?? ''}
                          onChange={(e) =>
                            setCustomPrices((prev) => ({
                              ...prev,
                              [p.id]: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                        <span className="text-xs text-muted-foreground">/mo</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">6. Storefront Preview</h2>
              <div className="rounded-xl border overflow-hidden bg-white shadow-sm">
                <div
                  className="flex items-center justify-between border-b px-4 py-3"
                  style={{ borderBottomColor: `${primaryColor}20` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {logoText || 'AH'}
                    </span>
                    <span className="font-bold text-sm text-gray-900">{businessName || 'Acme Hosting'}</span>
                  </div>
                  <button
                    type="button"
                    className="rounded-md px-3 py-1 text-xs font-medium text-white shadow-sm"
                    style={{ backgroundColor: accentColor }}
                  >
                    Client Portal
                  </button>
                </div>
                <div
                  className="px-4 py-8 text-center"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${accentColor}08)` }}
                >
                  <h3 className="text-xl font-bold text-gray-900">{headline || 'Host smarter. Scale faster.'}</h3>
                  <p className="mt-2 text-xs text-gray-600 max-w-md mx-auto">{description}</p>
                </div>
                <div className="px-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProducts.slice(0, 4).map((p) => (
                      <div key={p.id} className="rounded-lg border p-3 bg-white shadow-2xs">
                        <div className="font-medium text-sm text-gray-900">{p.name}</div>
                        <div className="mt-1 text-lg font-bold" style={{ color: primaryColor }}>
                          {formatCurrency(customPrices[p.id] ?? p.pricing[0]?.price ?? 0, state.business.currency)}
                          <span className="text-xs font-normal text-gray-500">/mo</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t px-4 py-2.5 text-center text-xs text-gray-400">
                  White-label hosting storefront powered by Runstead
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 text-center py-6">
              <PartyPopper className="h-14 w-14 text-accent mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Setup Complete!</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
                  Your demo hosting company &ldquo;{businessName}&rdquo; is fully configured with customized products,
                  prices, and white-label branding.
                </p>
              </div>

              {/* Completion Checklist */}
              <div className="rounded-xl border bg-muted/20 p-4 max-w-md mx-auto text-left text-xs space-y-2">
                <span className="font-semibold text-foreground uppercase tracking-wider block text-[11px]">
                  Setup Verification Checklist
                </span>
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Business entity &amp; contact profile persisted</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Storefront theme &amp; logo customized</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Catalog updated with {selectedProducts.length} published products</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Platform multi-tenant fleet operator synchronized</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <Button asChild>
                  <Link href="/dashboard/overview">
                    <Rocket className="mr-2 h-4 w-4" /> Go to Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/storefront">
                    View Published Storefront <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {step < steps.length - 1 && (
        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={back} disabled={step === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {step === steps.length - 2 ? (
            <Button onClick={finish}>
              Finish &amp; Launch <Check className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={next}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
