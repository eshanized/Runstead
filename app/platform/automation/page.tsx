import Link from 'next/link';
import { ShoppingCart, CreditCard, Zap, Server, Mail, Activity, RefreshCw, Pause, Play, ArrowRight } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const lifecycle = [
  { icon: ShoppingCart, title: 'Order Received', desc: 'Customer places an order through the storefront or admin panel.', status: 'awaiting_payment' },
  { icon: CreditCard, title: 'Payment Verified', desc: 'Payment is captured and verified through the connected payment gateway.', status: 'paid' },
  { icon: Zap, title: 'Provisioning Job Created', desc: 'The automation engine creates a provisioning job with the required service parameters.', status: 'provisioning' },
  { icon: Server, title: 'Service Provisioned', desc: 'The hosting account, VPS, or domain is created on the target infrastructure.', status: 'active' },
  { icon: Mail, title: 'Customer Notified', desc: 'Welcome email with credentials and service details is sent to the customer.', status: 'active' },
  { icon: Activity, title: 'Service Monitored', desc: 'The service is continuously monitored for uptime, resource usage, and health.', status: 'active' },
  { icon: RefreshCw, title: 'Renewal Processed', desc: 'When the billing cycle ends, renewal is processed automatically with invoice generation.', status: 'active' },
  { icon: Pause, title: 'Suspension / Restoration', desc: 'Services can be suspended for non-payment and restored when invoices are settled.', status: 'suspended' },
];

export default function AutomationPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Platform - Automation"
            title="Automated service lifecycle"
            description="From order to activation to renewal, the platform automates every step of the hosting service lifecycle — with retry handling, failure visibility, and reconciliation."
          />
          <div className="mt-8 flex gap-3 justify-center">
            <Button asChild><Link href="/dashboard/orders">View Orders</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard/services">View Services</Link></Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading align="left" eyebrow="Lifecycle" title="The complete service lifecycle" />
          <div className="mt-12 space-y-4">
            {lifecycle.map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <step.icon className="h-6 w-6" />
                  </div>
                  {i < lifecycle.length - 1 && <div className="h-full w-px flex-1 bg-border mt-2" />}
                </div>
                <Card className="mb-4 flex-1">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{step.title}</h3>
                      <span className="text-xs text-muted-foreground">Step {i + 1}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Resilience" title="Retry handling and failure visibility" description="When things go wrong, the platform does not hide it. Every provisioning job has a visible state, retry count, and error log." />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { title: 'Job States', desc: 'Every job tracks its state: queued, running, completed, failed, retrying. Admins can see and act on each state.' },
              { title: 'Retry Logic', desc: 'Failed jobs are automatically retried with exponential backoff. After max retries, the job is marked as failed for manual intervention.' },
              { title: 'Reconciliation', desc: 'The platform reconciles service states against orders and invoices, ensuring consistency across the billing and provisioning systems.' },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Alert className="border-emerald-200 bg-emerald-50/50">
            <AlertTitle className="text-emerald-900 font-semibold">Production Infrastructure Layer</AlertTitle>
            <AlertDescription className="text-emerald-800 text-xs mt-1">
              Runstead connects directly to production hosting providers, hypervisors, and server control centers via authenticated APIs (cPanel/WHM JSON-API v1, Docker, KVM). Provisioning tasks are durable, audited, and monitored with automated retries and dead-letter queue isolation.
            </AlertDescription>
          </Alert>
          <div className="mt-8 text-center">
            <Button asChild size="lg"><Link href="/dashboard/orders">Open Orders Console <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
