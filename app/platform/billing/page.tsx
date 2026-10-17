import Link from 'next/link';
import { Users, CreditCard, FileText, RefreshCw, TrendingUp, Receipt, Wallet, ArrowRight } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const billingFeatures = [
  { icon: Users, title: 'Customer Records', desc: 'Store customer details, company info, contact history, and account status. Each customer links to their services, invoices, and tickets.' },
  { icon: CreditCard, title: 'Recurring Billing', desc: 'Automate subscription billing with configurable cycles — monthly, quarterly, semi-annual, and annual renewals handled automatically.' },
  { icon: FileText, title: 'Invoice Generation', desc: 'Generate professional invoices with line items, tax breakdowns, and currency support. Send invoices by email and track delivery.' },
  { icon: Receipt, title: 'Payment Tracking', desc: 'Record payments by method — card, PayPal, bank transfer. Match payments to invoices and reconcile outstanding balances.' },
  { icon: RefreshCw, title: 'Refund Workflows', desc: 'Process full and partial refunds. Credit customer accounts automatically. Maintain an audit trail of every refund.' },
  { icon: Wallet, title: 'Credit Balances', desc: 'Customers can carry credit balances applied to future invoices. Track credit sources, usage, and remaining amounts.' },
  { icon: TrendingUp, title: 'Reporting & Reconciliation', desc: 'Revenue reports, outstanding balances, tax summaries, and payment method breakdowns for accounting reconciliation.' },
];

export default function BillingPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Platform - Billing"
            title="Billing and business management"
            description="The commercial engine of the platform: customers, products, orders, invoices, recurring billing, payment tracking, refunds, and reporting."
          />
          <div className="mt-8 flex gap-3 justify-center">
            <Button asChild><Link href="/dashboard/invoices">View Invoices</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard/customers">Manage Customers</Link></Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {billingFeatures.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Commercial Engine" title="Comprehensive Billing Capabilities" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Browse and search customer records with filters and sorting',
              'Create and edit customer profiles with form validation',
              'View customer activity history and service summaries',
              'Generate and manage invoices with line items and tax breakdowns',
              'Mark invoices as paid, void, or refunded',
              'View printable invoice details with payment history',
            ].map((item) => (
              <div key={item} className="rounded-lg border bg-card p-4 text-sm">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Alert className="border-emerald-200 bg-emerald-50/50">
            <AlertTitle className="text-emerald-900 font-semibold">PostgreSQL & Stripe Integrated Billing</AlertTitle>
            <AlertDescription className="text-emerald-800 text-xs mt-1">
              Production billing is powered by PostgreSQL with Row-Level Security, authoritative server-side pricing derivation, and Stripe checkout with replay-protected webhook signature verification.
            </AlertDescription>
          </Alert>
          <div className="mt-8 text-center">
            <Button asChild size="lg"><Link href="/dashboard/invoices">Open Invoices Console <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
