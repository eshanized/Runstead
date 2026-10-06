'use client';

import { useDemo } from '@/lib/demo/store';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function TermsOfServicePage() {
  const { state } = useDemo();
  const config = state.publishedStorefront || state.storefront;

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-3">
            <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white">
              Terms & Conditions
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Terms of Service & Acceptable Use
            </h1>
            <p className="text-xs text-slate-500">Effective Date: October 14, 2026 | Illustrative Draft Terms</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 leading-relaxed">
            <strong>Demonstration Notice:</strong> These terms are an illustrative draft document generated for the {config.businessName} investor demo. They serve as an example template for white-label reseller evaluation.
          </div>

          <Card className="border border-slate-200 bg-white p-6 sm:p-8 space-y-6 text-xs text-slate-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">1. Acceptance of Terms</h2>
              <p>
                By creating an account or placing an order through {config.businessName}, you agree to comply with these Terms of Service, Acceptable Use Policy, and our billing renewal schedules.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">2. Provisioning and Resource Usage</h2>
              <p>
                Shared hosting, Cloud VPS, and managed services are subject to published resource limits. Customers must not engage in abusive network patterns, DDoS attacks, cryptocurrency mining, or unsolicited bulk email distribution.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">3. Invoicing and Renewals</h2>
              <p>
                Services renew according to their configured billing cycle (monthly, quarterly, or annually). Invoices are issued 14 days prior to due date. Accounts with overdue invoices may enter automated suspension per platform lifecycle rules.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">4. Limitation of Liability</h2>
              <p>
                {config.businessName} provides automated infrastructure orchestration tools. Customers maintain responsibility for application code, database data backups, and third-party software updates.
              </p>
            </section>
          </Card>
        </div>
      </div>
    </StorefrontLayout>
  );
}
