import Link from 'next/link';
import { Server, HardDrive, PanelTop, DatabaseBackup, Activity, ShieldCheck, ArrowRight } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const hostingCapabilities = [
  { icon: Server, title: 'Shared Hosting', desc: 'Multi-tenant hosting with resource isolation, automated account creation, and per-user limits on storage, bandwidth, and email accounts.', status: 'roadmap' as const },
  { icon: HardDrive, title: 'VPS Infrastructure', desc: 'Virtual machine provisioning with configurable CPU, RAM, and storage. Snapshot management, reboots, and resource scaling.', status: 'roadmap' as const },
  { icon: PanelTop, title: 'Hosting Control Panel', desc: 'Customer-facing server management with file management, email configuration, database administration, and application installers.', status: 'roadmap' as const },
  { icon: Activity, title: 'Application Deployment', desc: 'One-click deployment for WordPress, Laravel, Node.js, and other popular applications with staging environments.', status: 'planned' as const },
  { icon: DatabaseBackup, title: 'Storage & Backups', desc: 'Managed storage volumes, automated daily backups with configurable retention, and point-in-time recovery.', status: 'roadmap' as const },
  { icon: ShieldCheck, title: 'Resource Management', desc: 'Per-service resource quotas, usage tracking, overage alerts, and automated suspension when limits are exceeded.', status: 'planned' as const },
];

export default function HostingPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Platform - Hosting"
            title="Hosting infrastructure vision"
            description="The long-term goal: a complete hosting infrastructure ecosystem — shared hosting, VPS, control panels, application deployment, storage, backups, and resource management."
          />
          <div className="mt-8 flex gap-3 justify-center">
            <Button asChild><Link href="/dashboard/services">View Services Console</Link></Button>
            <Button asChild variant="outline"><Link href="/roadmap">View Roadmap</Link></Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hostingCapabilities.map((c) => (
              <Card key={c.title} className="border-dashed">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                  <div className="mt-3"><StatusBadge status={c.status} /></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Architecture" title="The infrastructure roadmap" description="The platform evolves from a business-management SaaS to owned hosting infrastructure in deliberate stages." />
          <div className="mt-12">
            <HostingArchitectureDiagram />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          <Alert className="border-emerald-200 bg-emerald-50/50">
            <AlertTitle className="text-emerald-900 font-semibold">Live Hypervisor & Control Panel Operations</AlertTitle>
            <AlertDescription className="text-emerald-800 text-xs mt-1">
              Runstead provisions and controls accounts directly via official cPanel/WHM JSON-API v1, native hypervisors, and isolated container runtimes. Actions such as account creation, quotas, suspensions, databases, and reboots run securely with SSRF network guards.
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button asChild size="lg"><Link href="/dashboard/services">Open Services Console <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function HostingArchitectureDiagram() {
  const stages = [
    { phase: 'Phase 1', title: 'Business SaaS', items: ['Client management', 'Billing', 'Support', 'Storefront'], status: 'live' as const },
    { phase: 'Phase 2', title: 'Connected Hosting', items: ['cPanel/WHM connector', 'Plesk connector', 'Provisioning automation'], status: 'live' as const },
    { phase: 'Phase 3', title: 'Managed Services', items: ['Managed WordPress', 'Application deployment', 'SSL automation'], status: 'live' as const },
    { phase: 'Long-term', title: 'Owned Infrastructure', items: ['Hosting nodes', 'VPS infrastructure', 'Storage & backup', 'DNS servers'], status: 'roadmap' as const },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stages.map((stage, i) => (
        <div key={stage.title} className="relative">
          <Card className="h-full">
            <CardContent className="pt-6">
              <span className="text-xs font-medium text-accent">{stage.phase}</span>
              <h3 className="mt-1 font-semibold text-sm">{stage.title}</h3>
              <ul className="mt-3 space-y-1.5">
                {stage.items.map((item) => (
                  <li key={item} className="text-xs text-muted-foreground">- {item}</li>
                ))}
              </ul>
              <div className="mt-3"><StatusBadge status={stage.status} /></div>
            </CardContent>
          </Card>
          {i < stages.length - 1 && (
            <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-border md:block" />
          )}
        </div>
      ))}
    </div>
  );
}
