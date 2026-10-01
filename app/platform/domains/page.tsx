import Link from 'next/link';
import { Globe, Search, Network, ShieldCheck, RefreshCw, ArrowRight, Info } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const domainFeatures = [
  { icon: Search, title: 'Domain Search', desc: 'Check domain availability across supported TLDs. Display pricing and registration options to customers in real time.', status: 'demo' as const },
  { icon: Globe, title: 'Registration Workflows', desc: 'Submit registration requests through connected registrar APIs. Track pending, active, and failed registrations.', status: 'planned' as const },
  { icon: Network, title: 'DNS Management', desc: 'Full DNS zone editor with A, AAAA, CNAME, MX, TXT, CAA records. TTL control and record-level validation.', status: 'demo' as const },
  { icon: RefreshCw, title: 'Renewals & Transfers', desc: 'Track domain expiry dates, process renewals, and manage incoming domain transfers with status visibility.', status: 'planned' as const },
  { icon: ShieldCheck, title: 'SSL Automation', desc: 'Automatic SSL certificate provisioning and renewal through integrated certificate authorities (roadmap).', status: 'roadmap' as const },
  { icon: Globe, title: 'External Domain Connection', desc: 'Customers can connect externally registered domains by updating nameservers or pointing DNS records.', status: 'demo' as const },
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
            <Button asChild><Link href="/demo/domains">View Domains Demo</Link></Button>
            <Button asChild variant="outline"><Link href="/demo/dns">Try DNS Editor</Link></Button>
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
          <SectionHeading eyebrow="DNS Editor" title="A full DNS zone editor in the demo" description="The demo includes a working DNS zone editor where you can create, edit, and delete records with type and TTL validation." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['A and AAAA records', 'CNAME records', 'MX records with priority', 'TXT records', 'CAA records', 'TTL configuration', 'Record validation', 'Confirmation dialogs for destructive changes', 'Empty and error states'].map((item) => (
              <div key={item} className="rounded-lg border bg-card p-4 text-sm">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Registrar dependency notice</AlertTitle>
            <AlertDescription>
              Direct domain registration availability depends on registrar relationships and supported TLDs.
              The platform does not currently operate its own registrar accreditation. Domain registration
              in the demo is simulated using deterministic local data. Real registration, ownership checks,
              and live pricing require a production connection to an accredited registrar.
            </AlertDescription>
          </Alert>
          <Alert>
            <AlertTitle>DNS edit notice</AlertTitle>
            <AlertDescription>
              DNS changes in the demo are stored locally and never sent to an external DNS server.
              The production platform will propagate DNS changes through connected DNS providers or
              self-operated authoritative DNS servers (roadmap).
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button asChild size="lg"><Link href="/demo/dns">Try the DNS editor <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
