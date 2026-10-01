import Link from 'next/link';
import { ArrowRight, Users, CreditCard, Zap, Globe, Server, LifeBuoy, BarChart3, Store, Network } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const pillars = [
  { icon: Users, title: 'Client Management', desc: 'Customer records, service history, billing context, communication logs, and credit balances in one place.', href: '/platform/billing', status: 'demo' as const },
  { icon: CreditCard, title: 'Billing & Invoicing', desc: 'Recurring billing, invoice generation, payment tracking, refunds, and credit management.', href: '/platform/billing', status: 'demo' as const },
  { icon: Zap, title: 'Provisioning Automation', desc: 'Automated service lifecycle from order to activation with retry handling and failure visibility.', href: '/platform/automation', status: 'demo' as const },
  { icon: Globe, title: 'Domain Management', desc: 'Domain search, registration workflows, DNS management, and renewal tracking.', href: '/platform/domains', status: 'planned' as const },
  { icon: Server, title: 'Hosting Control', desc: 'Shared hosting, VPS management, control panel integration, and resource monitoring.', href: '/platform/hosting', status: 'roadmap' as const },
  { icon: Store, title: 'White-label Storefront', desc: 'Branded customer portals and storefronts with customizable products and pricing.', href: '/demo/storefront', status: 'demo' as const },
  { icon: LifeBuoy, title: 'Support System', desc: 'Ticket management, priority routing, internal notes, and customer conversation history.', href: '/demo/tickets', status: 'demo' as const },
  { icon: BarChart3, title: 'Analytics & Reporting', desc: 'Revenue tracking, customer growth, service distribution, and lifecycle reporting.', href: '/demo/analytics', status: 'demo' as const },
];

export default function PlatformPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Platform"
            title="One platform, every layer of your hosting business"
            description="Runstead connects customers, products, billing, provisioning, domains, DNS, hosting, support, and reporting into a unified system with a shared data model."
          />
          <div className="mt-8 flex gap-3 justify-center">
            <Button asChild><Link href="/demo">Explore Demo</Link></Button>
            <Button asChild variant="outline"><Link href="/pricing">View Pricing</Link></Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading align="left" eyebrow="Architecture" title="How the platform fits together" description="Every capability shares the same customer database, product catalog, and billing engine. No syncing, no data silos." />
          <div className="mt-12">
            <EcosystemDiagram />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Capabilities" title="Explore the platform modules" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <Link key={p.title} href={p.href}>
                <Card className="h-full transition-all hover:shadow-md hover:border-accent/40">
                  <CardHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <p.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <StatusBadge status={p.status} />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Deep dive" title="Explore each module in detail" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: 'Billing & Business', href: '/platform/billing', desc: 'Customers, invoices, subscriptions' },
              { label: 'Automation', href: '/platform/automation', desc: 'Service lifecycle & provisioning' },
              { label: 'Domains', href: '/platform/domains', desc: 'Registration, DNS, SSL' },
              { label: 'Hosting', href: '/platform/hosting', desc: 'Shared, VPS, control panels' },
              { label: 'Security', href: '/security', desc: 'Architecture & access control' },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-sm">{item.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function EcosystemDiagram() {
  const layers = [
    { label: 'Storefront & Customer Portal', items: ['Branded storefront', 'Self-service portal', 'Product ordering', 'Invoice payment'] },
    { label: 'Business Operating System', items: ['Client management', 'Billing & invoicing', 'Order automation', 'Support tickets', 'Analytics'] },
    { label: 'Service Automation', items: ['Provisioning engine', 'Service lifecycle', 'DNS management', 'Domain workflows'] },
    { label: 'Infrastructure Layer', items: ['Hosting connectors', 'VPS provisioning', 'Storage & backups', 'Monitoring (roadmap)'] },
  ];
  return (
    <div className="space-y-4">
      {layers.map((layer, i) => (
        <div key={layer.label} className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              {i + 1}
            </div>
            <h3 className="font-semibold">{layer.label}</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {layer.items.map((item) => (
              <div key={item} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
