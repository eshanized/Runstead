import Link from 'next/link';
import { Globe, Search, Network, ShieldCheck, RefreshCw, ArrowRight, Info } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const domainFeatures = [
  { icon: Search, title: 'Domain Search', desc: 'Check domain availability across supported TLDs. Display pricing and registration options to customers in real time.', status: 'live' as const },
  { icon: Globe, title: 'Registration Workflows', desc: 'Submit registration requests through connected registrar APIs. Track pending, active, and failed registrations.', status: 'live' as const },
  { icon: Network, title: 'DNS Management', desc: 'Full DNS zone editor with A, AAAA, CNAME, MX, TXT, CAA records. TTL control and record-level validation.', status: 'live' as const },
  { icon: RefreshCw, title: 'Renewals & Transfers', desc: 'Track domain expiry dates, process renewals, and manage incoming domain transfers with status visibility.', status: 'live' as const },
  { icon: ShieldCheck, title: 'SSL Automation', desc: 'Automatic SSL certificate provisioning and renewal through integrated certificate authorities.', status: 'live' as const },
  { icon: Globe, title: 'External Domain Connection', desc: 'Customers can connect externally registered domains by updating nameservers or pointing DNS records.', status: 'live' as const },
];

export default function DomainsPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Platform - Domains"
            title="Domain management and DNS"
            description="Search, register, manage, and renew domains. Edit DNS zones with a full-featured record editor. Connect external domains and automate SSL provisioning."
          />
          <div className="mt-8 flex gap-3 justify-center">
            <Button asChild><Link href="/dashboard/domains">View Domains</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard/dns">Open DNS Editor</Link></Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {domainFeatures.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                  <div className="mt-3"><StatusBadge status={f.status} /></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="DNS Editor" title="Authoritative DNS Zone Management" description="Full-featured zone editor supporting RFC-compliant records with TTL validation, instant propagation, and health checking." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['A and AAAA records', 'CNAME records', 'MX records with priority', 'TXT records', 'CAA records', 'TTL configuration', 'Record validation', 'Confirmation dialogs for destructive changes', 'Empty and error states'].map((item) => (
              <div key={item} className="rounded-lg border bg-card p-4 text-sm">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          <Alert className="border-emerald-200 bg-emerald-50/50">
            <Info className="h-4 w-4 text-emerald-700" />
            <AlertTitle className="text-emerald-900 font-semibold">Authoritative DNS & Registrar Integration</AlertTitle>
            <AlertDescription className="text-emerald-800 text-xs mt-1">
              Runstead integrates directly with registrar APIs and authoritative DNS nameserver clusters. All zone mutations are transactional, audited, and propagated securely to upstream nameservers.
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button asChild size="lg"><Link href="/dashboard/dns">Open DNS Zone Editor <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
