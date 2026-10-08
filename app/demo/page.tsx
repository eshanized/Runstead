import Link from 'next/link';
import { ArrowRight, MousePointerClick, Smartphone, RotateCcw, Eye } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const demoFeatures = [
  { icon: MousePointerClick, title: 'Fully interactive', desc: 'Click through a realistic product dashboard. Every button, form, and filter works.' },
  { icon: Eye, title: 'No account needed', desc: 'No signup, no email, no credit card, no API key. Just open the demo and start exploring.' },
  { icon: Smartphone, title: 'Works on any device', desc: 'Responsive design that works on desktop, tablet, and mobile.' },
  { icon: RotateCcw, title: 'Reset anytime', desc: 'Made changes you want to undo? Reset all demo data with one click.' },
];

const demoRoutes = [
  { label: 'Executive Dashboard', href: '/demo/overview', desc: 'MRR, active services, revenue charts, and system status' },
  { label: 'Customer Management', href: '/demo/customers', desc: 'Browse, search, filter, create, and edit customer records' },
  { label: 'Product Catalog', href: '/demo/products', desc: 'Manage hosting plans, pricing, and add-ons' },
  { label: 'Order Management', href: '/demo/orders', desc: 'View order lifecycle and simulate state transitions' },
  { label: 'Service Management', href: '/demo/services', desc: 'Monitor hosting services and resource usage' },
  { label: 'Domain Management', href: '/demo/domains', desc: 'Search domains, manage registrations, and track renewals' },
  { label: 'DNS Zone Editor', href: '/demo/dns', desc: 'Create, edit, and delete DNS records with validation' },
  { label: 'Invoice Management', href: '/demo/invoices', desc: 'Generate invoices, mark payments, and process refunds' },
  { label: 'Support Tickets', href: '/demo/tickets', desc: 'Manage ticket conversations and status transitions' },
  { label: 'Analytics', href: '/demo/analytics', desc: 'Revenue, growth, and service distribution charts' },
  { label: 'Storefront Editor', href: '/demo/storefront', desc: 'Customize a white-label hosting storefront with live preview' },
  { label: 'Integrations', href: '/demo/integrations', desc: 'Manage provider connections and test integration status' },
  { label: 'Settings', href: '/demo/settings', desc: 'Configure business profile, branding, team, and notifications' },
  { label: 'Onboarding Wizard', href: '/demo/onboarding', desc: 'Step-by-step guide to launching a hosting business' },
];

export default function DemoLandingPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
              <span className="flex h-2 w-2 rounded-full bg-accent" />
              Interactive Demo
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl text-balance">
              Explore the platform without signing up
            </h1>
            <p className="mt-6 text-lg text-muted-foreground text-balance">
              The full Runstead product experience, running entirely in your browser. No account,
              no credit card, no API key. Just click and explore.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/demo/overview">
                  Launch Dashboard Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/demo/onboarding">Try Onboarding Wizard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {demoFeatures.map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-6">
                  <f.icon className="h-8 w-8 text-accent" />
                  <h3 className="mt-3 font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Demo routes" title="Everything you can explore" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {demoRoutes.map((route) => (
              <Link key={route.href} href={route.href}>
                <Card className="h-full transition-all hover:shadow-md hover:border-accent/40">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-sm">{route.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{route.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-balance">All data is simulated and local</h2>
          <p className="mt-4 text-muted-foreground">
            The demo stores all data in your browser. No real payments are processed, no real domains are registered,
            and no real infrastructure is provisioned. You can reset all data at any time from the demo settings.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
