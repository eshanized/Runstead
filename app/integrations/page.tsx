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
            <Button asChild><Link href="/demo/integrations">View Integrations Demo</Link></Button>
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
          <Alert>
            <AlertTitle>Integration status notice</AlertTitle>
            <AlertDescription>
              Integration statuses are shown explicitly: demo, planned, available, and unavailable.
              No integration listed here implies an approved partnership or live connection unless
              marked as available. The demo simulates connection states for demonstration purposes
              only. No real provider credentials are collected or stored in the demo.
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button asChild size="lg"><Link href="/demo/integrations">Explore the integrations demo <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
