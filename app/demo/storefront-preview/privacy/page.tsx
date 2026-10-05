'use client';

import { useDemo } from '@/lib/demo/store';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  const { state } = useDemo();
  const config = state.publishedStorefront || state.storefront;

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-3">
            <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white">
              Legal & Compliance
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Privacy Policy & Data Handling
            </h1>
            <p className="text-xs text-slate-500">Effective Date: October 14, 2026 | Illustrative Draft Policy</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 leading-relaxed">
            <strong>Demonstration Notice:</strong> This privacy document is an illustrative draft template generated for the {config.businessName} investor demo. It has not undergone formal legal counsel review and serves as a placeholder for white-label reseller customization.
          </div>

          <Card className="border border-slate-200 bg-white p-6 sm:p-8 space-y-6 text-xs text-slate-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">1. Information We Collect</h2>
              <p>
                When you create an account, purchase hosting services, or register a domain through {config.businessName}, we collect basic customer identification data including your full name, business email, organization name, and billing address.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">2. How Information Is Used</h2>
              <p>
                Collected information is strictly utilized to authenticate your customer portal session, provision container and virtual machine resources, process automated invoice cycles, and transmit critical service notifications.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">3. Domain WHOIS Data Processing</h2>
              <p>
                Domain name registrations require accurate registrant data for registry transmission per ICANN regulatory requirements. We offer free automated WHOIS privacy proxy masking on all eligible top-level domains.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">4. Contact & Inquiries</h2>
              <p>
                For privacy inquiries or data removal requests regarding {config.businessName}, contact our compliance desk at <strong>{config.email}</strong>.
              </p>
            </section>
          </Card>
        </div>
      </div>
    </StorefrontLayout>
  );
}
