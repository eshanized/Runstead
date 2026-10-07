'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Rocket,
  Check,
  ArrowRight,
  ArrowLeft,
  Building2,
  Palette,
  CreditCard,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { useDemo } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import { pricingPlans } from '@/lib/config/pricing';
import { siteConfig } from '@/lib/config/site';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function LaunchPage() {
  return (
    <MarketingLayout>
      <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading SaaS launch experience...</div>}>
        <LaunchContent />
      </Suspense>
    </MarketingLayout>
  );
}

const businessCategories = [
  { id: 'freelancer', title: 'Freelancer / Developer', desc: 'Starting a boutique hosting business for web clients' },
  { id: 'agency', title: 'Digital Agency', desc: 'Bundling managed hosting with client retainers and services' },
  { id: 'entrepreneur', title: 'Hosting Entrepreneur', desc: 'Launching a new commercial hosting and domain brand' },
  { id: 'existing', title: 'Existing Hosting Company', desc: 'Migrating from legacy systems (like WHMCS) to modern SaaS' },
];

function LaunchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, setState, resetDemo } = useDemo();

  const initialPlanParam = searchParams.get('plan') || 'Growth';
  const matchedPlan = pricingPlans.find((p) => p.name.toLowerCase() === initialPlanParam.toLowerCase()) || pricingPlans[2];

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedPlan, setSelectedPlan] = useState(matchedPlan.name);
  const [annualBilling, setAnnualBilling] = useState(true);

  // Business profile
  const [businessName, setBusinessName] = useState(state.business.businessName || 'Veloce Cloud Hosting');
  const [category, setCategory] = useState(state.business.category || 'agency');
  const [email, setEmail] = useState(state.business.email || 'admin@velocecloud.host');
  const [phone, setPhone] = useState(state.business.phone || '+1 888 555 0199');

  // Brand config
  const [headline, setHeadline] = useState(state.storefront.headline || 'Host smarter. Scale faster.');
  const [logoText, setLogoText] = useState(state.storefront.logoText || 'VC');
  const [primaryColor, setPrimaryColor] = useState(state.storefront.primaryColor || '#0f5fff');
  const [accentColor, setAccentColor] = useState(state.storefront.accentColor || '#00c896');

  // Simulated confirmation
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'invoice' | 'sandbox'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialPlanParam) {
      const p = pricingPlans.find((x) => x.name.toLowerCase() === initialPlanParam.toLowerCase());
      if (p) setSelectedPlan(p.name);
    }
  }, [initialPlanParam]);

  const activePlan = pricingPlans.find((p) => p.name === selectedPlan) || pricingPlans[1];
  const calculatedPrice = annualBilling ? activePlan.annualPrice : activePlan.monthlyPrice;

  function handleCompleteLaunch(target: 'onboarding' | 'dashboard') {
    if (!businessName.trim()) {
      toast.error('Please enter a business name.');
      setStep(2);
      return;
    }
    if (!workflows.isValidEmail(email)) {
      toast.error('Please enter a valid email address.');
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      setState((prev) =>
        workflows.launchSaaSTenant(prev, {
          planName: activePlan.name,
          billingInterval: annualBilling ? 'annually' : 'monthly',
          businessName,
          category,
          email,
          phone,
          headline,
          logoText,
          primaryColor,
          accentColor,
        })
      );

      toast.success(`Demo tenant "${businessName}" successfully provisioned!`);
      if (target === 'onboarding') {
        router.push('/demo/onboarding');
      } else {
        router.push('/demo/overview');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to initialize tenant.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Banner & Progress */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-accent text-accent">
              <Sparkles className="mr-1 h-3.5 w-3.5" /> Simulated SaaS Acquisition
            </Badge>
            <span className="text-xs text-muted-foreground">Tonmoy Infrastructure SaaS Setup</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Launch Your Hosting Business</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete this simulated signup journey to create a demo tenant context and enter your reseller dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => resetDemo()}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset Demo
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/pricing">View Plans</Link>
          </Button>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="mb-8 grid grid-cols-4 gap-2 text-center text-xs font-medium">
        {[
          { num: 1, label: '1. Select SaaS Plan' },
          { num: 2, label: '2. Business Profile' },
          { num: 3, label: '3. Brand Identity' },
          { num: 4, label: '4. Subscription Summary' },
        ].map((s) => (
          <div
            key={s.num}
            className={`rounded-lg border p-2.5 transition-colors ${
              step === s.num
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : step > s.num
                ? 'border-success/40 bg-success/5 text-success'
                : 'border-border/60 text-muted-foreground'
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Step 1: Select Plan */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Choose your platform subscription plan</h2>
              <p className="text-sm text-muted-foreground">
                This is the SaaS tier your hosting company pays to Tonmoy Infrastructure.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${!annualBilling ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch checked={annualBilling} onCheckedChange={setAnnualBilling} id="billing-interval" />
              <span className={`text-xs ${annualBilling ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                Annual <span className="text-success font-medium">(Save ~20%)</span>
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {pricingPlans.map((plan) => {
              const price = annualBilling ? plan.annualPrice : plan.monthlyPrice;
              const isSelected = selectedPlan === plan.name;
              return (
                <Card
                  key={plan.name}
                  onClick={() => setSelectedPlan(plan.name)}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]' : ''
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <CardDescription className="text-xs line-clamp-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="my-2">
                      <span className="text-2xl font-bold">
                        {price === null ? 'Custom' : price === 0 ? 'Free' : `$${price}`}
                      </span>
                      {price !== null && price !== 0 && (
                        <span className="text-xs text-muted-foreground">/mo</span>
                      )}
                    </div>
                    <div className="space-y-1.5 border-t pt-2 text-xs text-muted-foreground">
                      {plan.limits.map((l) => (
                        <div key={l.label} className="flex justify-between">
                          <span>{l.label}:</span>
                          <span className="font-medium text-foreground">{l.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Capabilities breakdown of selected plan */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Included in {activePlan.name} Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 text-xs">
                {activePlan.features.map((feat) => (
                  <div key={feat.label} className="flex items-center gap-2">
                    {feat.included ? (
                      <Check className="h-3.5 w-3.5 text-success shrink-0" />
                    ) : (
                      <span className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 text-center">-</span>
                    )}
                    <span className={feat.included ? 'text-foreground' : 'text-muted-foreground line-through'}>
                      {feat.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)}>
              Continue to Business Profile <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Business Profile */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Reseller Business Profile
            </CardTitle>
            <CardDescription>
              Configure the commercial identity for your hosting platform. This separates your company from Runstead infrastructure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="biz-name">Hosting Business Name *</Label>
                <Input
                  id="biz-name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Veloce Cloud, Apex Serverworks"
                />
              </div>

              <div className="space-y-2">
                <Label>Business Category *</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {businessCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`rounded-lg border p-3.5 text-left transition-all ${
                        category === cat.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:border-border'
                      }`}
                    >
                      <div className="text-sm font-semibold">{cat.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="biz-email">Primary Reseller Email *</Label>
                  <Input
                    id="biz-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@yourhosting.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biz-phone">Reseller Phone / Support</Label>
                  <Input
                    id="biz-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 888 555 0100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next: Branding & Identity <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Brand Identity */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> White-Label Brand Settings
            </CardTitle>
            <CardDescription>
              Set up initial themes for your customer-facing storefront and client portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store-headline">Storefront Headline</Label>
                  <Input
                    id="store-headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Host smarter. Scale faster."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo-symbol">Logo Monogram / Badge (2-3 chars)</Label>
                  <Input
                    id="logo-symbol"
                    maxLength={3}
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value.toUpperCase())}
                    placeholder="VC"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Brand Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-9 w-10 cursor-pointer rounded border p-0.5"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Brand Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-9 w-10 cursor-pointer rounded border p-0.5"
                      />
                      <Input
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Storefront Header Preview
                </span>
                <div className="mt-4 rounded-lg border bg-white p-4 text-gray-900">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white text-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {logoText || 'VC'}
                      </div>
                      <span className="font-bold text-sm">{businessName || 'Your Hosting Brand'}</span>
                    </div>
                    <button
                      type="button"
                      className="rounded px-2.5 py-1 text-xs text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      Client Portal
                    </button>
                  </div>
                  <div className="py-6 text-center">
                    <h3 className="text-base font-bold text-gray-900">{headline || 'Next-Gen Infrastructure'}</h3>
                    <p className="mt-1 text-xs text-gray-500">Fast, reliable cloud hosting with 24/7 dedicated engineering support.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Review Subscription <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Subscription Summary & Simulated Confirmation */}
      {step === 4 && (
        <div className="grid gap-6 md:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Simulated SaaS Payment Confirmation
              </CardTitle>
              <CardDescription>
                Confirm your demo subscription with Tonmoy Infrastructure. No real funds or credit cards are involved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{activePlan.name} Tier SaaS Subscription</div>
                    <div className="text-xs text-muted-foreground">
                      Billed {annualBilling ? 'annually' : 'monthly'} to {siteConfig.company}
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{activePlan.name}</Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Tenant Legal Entity:</span>
                    <div className="font-medium mt-0.5">{businessName} LLC</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tenant Category:</span>
                    <div className="font-medium capitalize mt-0.5">{category}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contact Email:</span>
                    <div className="font-medium mt-0.5">{email}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Customer Capacity:</span>
                    <div className="font-medium mt-0.5">
                      {activePlan.limits.find((l) => l.label === 'Customers')?.value || '500'} Accounts
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment simulation options */}
              <div className="space-y-3">
                <Label>Simulated Payment Authorization Method</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { id: 'card', label: 'Simulated Card', desc: 'Pre-authorized test token' },
                    { id: 'invoice', label: 'Net-30 Invoice', desc: 'Simulated invoice terms' },
                    { id: 'sandbox', label: 'Sandbox Grant', desc: 'Demo voucher credit' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        paymentMethod === m.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:border-border'
                      }`}
                    >
                      <div className="text-xs font-semibold">{m.label}</div>
                      <div className="text-[11px] text-muted-foreground">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-xs text-muted-foreground space-y-1.5">
                <div className="font-semibold text-accent flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Demo Safety Guarantee
                </div>
                <p>
                  This is strictly a local browser demonstration. No real charges are processed. Completing this flow
                  updates the internal state of your demo session and links your configured business profile to the
                  reseller dashboard and platform administrator directory.
                </p>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => handleCompleteLaunch('onboarding')}
                  >
                    Launch to Onboarding Wizard
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    onClick={() => handleCompleteLaunch('dashboard')}
                  >
                    Launch to Dashboard <Rocket className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing summary sidebar */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Subscription Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Plan ({activePlan.name})</span>
                  <span className="font-medium">
                    {calculatedPrice === null ? 'Custom' : calculatedPrice === 0 ? '$0.00' : `$${calculatedPrice}.00`}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Billing Interval</span>
                  <span className="capitalize">{annualBilling ? 'Annually' : 'Monthly'}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Platform Setup Fee</span>
                  <span className="text-success font-medium">Waived ($0)</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-sm">Total Due Today</span>
                <span className="text-2xl font-bold">
                  {calculatedPrice === null ? 'Contact' : calculatedPrice === 0 ? '$0.00' : `$${calculatedPrice}.00`}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                All prices are illustrative demo models for Tonmoy Infrastructure.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
