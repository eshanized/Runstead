import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { integrationCategories } from '@/lib/config/features';

export default function IntegrationsPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Integrations"
            title="Connect the tools you already use"
            description="The platform is designed to integrate with hosting providers, domain registrars, payment gateways, DNS providers, email services, monitoring tools, and developer APIs."
          />
          <div className="mt-8 flex gap-3 justify-center">
            <Button asChild><Link href="/dashboard/integrations">View Integrations</Link></Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {integrationCategories.map((cat) => (
            <div key={cat.category}>
              <h2 className="text-xl font-semibold mb-4">{cat.category}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cat.integrations.map((int) => (
                  <Card key={int.name}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm">{int.name}</h3>
                        <StatusBadge status={int.status} />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{int.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          <Alert className="border-emerald-200 bg-emerald-50/50">
            <AlertTitle className="text-emerald-900 font-semibold">Production Gateway & Credential Security</AlertTitle>
            <AlertDescription className="text-emerald-800 text-xs mt-1">
              All external hosting, registrar, payment, and notification credentials are encrypted at rest using AES-256-GCM authenticated encryption. Network requests enforce strict SSRF guards blocking private IPv4/IPv6 ranges and cloud metadata services.
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button asChild size="lg"><Link href="/dashboard/integrations">Configure Integrations <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
