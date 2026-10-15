import Link from 'next/link';
import {
  ArrowRight, Server, Users, CreditCard, Zap, Globe, Store,
  LifeBuoy, BarChart3, Network, ShieldCheck, Layers, CheckCircle2,
  AlertTriangle, Rocket, Building2, Code, Cloud, Workflow,
  TrendingUp, DatabaseBackup, PanelTop, HardDrive, Activity,
} from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { platformFeatures, infrastructureFeatures, roadmapStages } from '@/lib/config/features';
import { pricingPlans } from '@/lib/config/pricing';
import { DevelopmentSummary } from '@/components/marketing/development-summary';
import { getProjectProgress } from '@/lib/github/client';

export const dynamic = 'force-dynamic';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, CreditCard, Zap, Globe, Server, Store, LifeBuoy, BarChart3,
  Network, ShieldCheck, HardDrive, PanelTop, DatabaseBackup, Activity,
  Code, Cloud, Building2, Rocket, Workflow, TrendingUp, Layers,
};

export default async function Home() {
  const progress = await getProjectProgress();

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-dots opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-slide-up">
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-accent" />
                A modern alternative to WHMCS
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
                Start, operate, and grow a{' '}
                <span className="text-accent">hosting business</span> from one platform
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground text-balance">
                Stop stitching together a dozen tools for billing, provisioning, support, and storefronts.
                {` ${'Runstead'}`} unifies your entire hosting operation into a single, modern system.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/demo">
                    Explore Interactive Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/platform">Explore the Platform</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No account required. No credit card. No API key.
              </p>
            </div>

            {/* Dashboard Preview Mockup */}
            <div className="animate-fade-in">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Live Roadmap & Progress Summary */}
      <DevelopmentSummary progress={progress} />

      {/* Problem Section */}
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="The problem"
            title="Running a hosting business means juggling too many tools"
            description="Billing in one app, provisioning in another, support tickets somewhere else, and a storefront that barely integrates with anything. Each tool has its own login, its own data model, and its own monthly bill."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: AlertTriangle, title: 'Fragmented billing', desc: 'Invoices, subscriptions, and payment tracking spread across spreadsheets and disconnected systems.' },
              { icon: AlertTriangle, title: 'Manual provisioning', desc: 'Every new order requires manual steps to create hosting accounts and configure services.' },
              { icon: AlertTriangle, title: 'Unbranded portals', desc: 'Your clients log into third-party interfaces with someone else is branding and logo.' },
              { icon: AlertTriangle, title: 'No unified view', desc: 'You cannot see revenue, churn, service health, and support load in one dashboard.' },
            ].map((item) => (
              <Card key={item.title} className="border-destructive/20">
                <CardContent className="pt-6">
                  <item.icon className="h-8 w-8 text-destructive" />
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="The solution"
            title="One platform for your entire hosting operation"
            description="Runstead consolidates customer management, billing, automation, domains, DNS, support, and storefronts into a single system with a shared data model."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {platformFeatures.map((feature) => {
              const Icon = iconMap[feature.icon] ?? Layers;
              return (
                <Card key={feature.title} className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                    <div className="mt-3">
                      <StatusBadge status={feature.status} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How it works"
            title="Launch a hosting business in five steps"
            description="From business setup to first sale, the platform guides you through the entire process."
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-5">
            {[
              { step: 1, title: 'Create profile', desc: 'Set up your business name, branding, and contact details.' },
              { step: 2, title: 'Choose products', desc: 'Select hosting plans, domains, and add-ons to sell.' },
              { step: 3, title: 'Set pricing', desc: 'Configure billing cycles and prices for each product.' },
              { step: 4, title: 'Customize storefront', desc: 'Brand your customer-facing storefront with colors and messaging.' },
              { step: 5, title: 'Start selling', desc: 'Accept orders, automate provisioning, and bill customers.' },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
                  {s.step}
                </div>
                {i < 4 && (
                  <div className="absolute left-12 top-6 hidden h-px w-full bg-border lg:block" />
                )}
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/demo/onboarding">
                Try the onboarding wizard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Infrastructure vision */}
      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Infrastructure vision"
            title="From software platform to hosting ecosystem"
            description="The platform starts as a business-management SaaS. The long-term roadmap includes owned hosting infrastructure, DNS servers, and a full infrastructure ecosystem."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {infrastructureFeatures.map((feature) => {
              const Icon = iconMap[feature.icon] ?? Layers;
              return (
                <Card key={feature.title} className="border-dashed">
                  <CardHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                    <div className="mt-3">
                      <StatusBadge status={feature.status} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/roadmap">View the full roadmap</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Audience benefits */}
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Who it is for"
            title="Built for every type of hosting business"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Code, title: 'Freelancers', desc: 'Turn client hosting into recurring revenue with a branded portal and automated billing.', href: '/solutions/freelancers' },
              { icon: Building2, title: 'Agencies', desc: 'Manage hundreds of client accounts with team roles, bulk operations, and built-in support.', href: '/solutions/agencies' },
              { icon: Rocket, title: 'New entrepreneurs', desc: 'Launch a hosting business without buying servers. Go live in minutes with guided setup.', href: '/solutions/entrepreneurs' },
              { icon: Server, title: 'Existing hosts', desc: 'Replace WHMCS and fragmented tooling with a unified platform and modern API.', href: '/solutions/existing-hosts' },
              { icon: Cloud, title: 'Infrastructure businesses', desc: 'Scale operations with deep automation, monitoring, and a path to owned infrastructure.', href: '/solutions/infrastructure' },
              { icon: Workflow, title: 'Resellers', desc: 'White-label everything from storefront to support tickets under your own brand.', href: '/solutions' },
            ].map((item) => (
              <Link key={item.title} href={item.href}>
                <Card className="h-full transition-all hover:shadow-md hover:border-accent/40">
                  <CardContent className="pt-6">
                    <item.icon className="h-8 w-8 text-accent" />
                    <h3 className="mt-3 font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                      Learn more <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Complexity reduction */}
      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Operational simplicity"
                title="Replace six tools with one"
                description="Every separate tool you use today adds a login, a data silo, and a monthly subscription. Runstead unifies them under one roof."
              />
              <ul className="mt-8 space-y-3">
                {[
                  'Single customer database — no more syncing between systems',
                  'Orders automatically create services, invoices, and provisioning jobs',
                  'Storefront, billing, and support share the same product catalog',
                  'One dashboard for revenue, services, tickets, and infrastructure',
                  'One API for automation instead of six different webhook formats',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ComplexityDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Pricing"
            title="Plans that scale with your business"
            description="Start free with the Sandbox, then upgrade as you grow. All prices are indicative and subject to validation."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlighted ? 'border-accent shadow-md' : ''}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {plan.monthlyPrice === null ? (
                      'Custom'
                    ) : plan.monthlyPrice === 0 ? (
                      'Free'
                    ) : (
                      <>
                        ${plan.monthlyPrice}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.monthlyPrice === null ? 'Contact us' : 'Indicative pricing'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/pricing">Compare all plans</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Roadmap preview */}
      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Roadmap"
            title="From SaaS foundation to hosting ecosystem"
            description="Six stages of evolution from a business-management platform to a complete hosting infrastructure."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {roadmapStages.map((stage, i) => (
              <div key={stage.stage} className="relative">
                <div className="rounded-lg border bg-card p-4">
                  <span className="text-xs font-medium text-accent">{stage.stage}</span>
                  <h3 className="mt-1 text-sm font-semibold">{stage.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{stage.description}</p>
                </div>
                {i < roadmapStages.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-border lg:block" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/roadmap">Explore the roadmap</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            See the platform in action
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-balance">
            Explore the full interactive demo. Navigate the dashboard, manage customers, create orders,
            edit DNS zones, customize a storefront, and complete the onboarding wizard — no signup required.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/demo">
                Launch Interactive Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Contact the team</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function DashboardMockup() {
  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/50 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-destructive/60" />
          <div className="h-3 w-3 rounded-full bg-warning/60" />
          <div className="h-3 w-3 rounded-full bg-success/60" />
        </div>
        <div className="ml-2 flex-1 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
          app.runstead.tonmoyinfrastructure.org/overview
        </div>
      </div>
      <div className="grid grid-cols-[180px_1fr]">
        <div className="border-r border-border/60 bg-muted/30 p-3 space-y-1">
          {['Overview', 'Customers', 'Products', 'Orders', 'Services', 'Domains', 'Invoices', 'Tickets'].map((item, i) => (
            <div
              key={item}
              className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${
                i === 0 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <div className="h-3 w-3 rounded-sm bg-current opacity-60" />
              {item}
            </div>
          ))}
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground">DEMO MODE</div>
              <div className="text-sm font-semibold">CloudVista Hosting</div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-6 rounded-full bg-accent/20" />
              <div className="h-6 w-6 rounded-full bg-muted" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'MRR', value: '$5,847' },
              { label: 'Customers', value: '96' },
              { label: 'Services', value: '9' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border p-2.5">
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="text-sm font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs font-medium mb-2">Revenue overview</div>
            <div className="flex items-end gap-1.5 h-24">
              {[40, 55, 48, 62, 75, 68, 82, 88, 79, 92, 85, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-accent/70"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-lg border p-3 space-y-1.5">
            <div className="text-xs font-medium">Recent orders</div>
            {[
              { order: 'ORD-0156 VPS Pro', status: 'provisioning' as const },
              { order: 'ORD-0155 Business Hosting', status: 'active' as const },
              { order: 'ORD-0152 Domain Registration', status: 'active' as const },
            ].map(({ order, status }) => (
              <div key={order} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{order}</span>
                <StatusBadge status={status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplexityDiagram() {
  const tools = ['WHMCS', 'cPanel', 'Helpdesk', 'DNS Manager', 'Spreadsheet', 'Storefront'];
  return (
    <Card className="p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground">Before: 6 separate tools</h4>
          <div className="space-y-2">
            {tools.map((tool) => (
              <div key={tool} className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm">{tool}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground">After: 1 platform</h4>
          <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-accent/30 bg-accent/5 p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Server className="h-8 w-8" />
            </div>
            <span className="mt-3 font-bold">Runstead</span>
            <span className="text-xs text-muted-foreground">Everything in one place</span>
            {['Billing', 'Provisioning', 'Support', 'DNS', 'Storefront', 'Analytics'].map((label) => (
              <span key={label} className="mt-1 text-xs text-muted-foreground">- {label}</span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
