import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { siteConfig } from '@/lib/config/site';

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <SectionHeading
            align="left"
            eyebrow="Legal & Compliance (Demo Model)"
            title="Privacy Notice & Data Processing Policy"
            description="Demonstration model of the proposed privacy architecture for the Runstead multi-tenant SaaS platform."
          />

          <Alert>
            <AlertTitle>Demonstration Disclaimer</AlertTitle>
            <AlertDescription>
              This document is an illustrative demonstration policy prepared by {siteConfig.company} for investor review.
              Runstead is currently an interactive demonstration prototype. No production consumer data is processed or collected.
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="space-y-6 pt-6 text-sm text-muted-foreground leading-relaxed">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">1. Data Architecture & Separation</h3>
                <p>
                  Runstead is designed as a secure multi-tenant hosting operating system. Each reseller tenant operates within an isolated logical partition. Customer data, billing transactions, domain registrations, and DNS configurations are partitioned by tenant identifier.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">2. Local Browser Demo Data Storage</h3>
                <p>
                  In this interactive demonstration, state mutations, customer records, invoices, and provisioning runs are stored purely in your browser&apos;s local storage (under the schema key <code className="text-foreground font-mono">runstead_demo_v2</code>). No real personal data or payment credentials are sent to external servers.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">3. Proposed Production Compliance Standards</h3>
                <p>
                  The production Runstead architecture will support GDPR data processing agreements (DPAs), automated subject access requests (SARs), end-to-end encryption at rest for sensitive API credentials, and role-based access control (RBAC).
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">4. Questions & Inquiries</h3>
                <p>
                  Inquiries regarding the demonstration project or architectural disclosures may be directed to {siteConfig.contactEmail}.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </MarketingLayout>
  );
}
