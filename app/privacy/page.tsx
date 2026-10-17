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
            eyebrow="Data Protection"
            title="Privacy & Data Processing Policy"
            description="Policy governing data collection, tenancy isolation, encryption standards, and privacy rights across the Runstead platform."
          />

          <Alert className="border-emerald-200 bg-emerald-50/50">
            <AlertTitle className="text-emerald-900 font-semibold">Multi-Tenant Data Privacy</AlertTitle>
            <AlertDescription className="text-emerald-800 text-xs mt-1">
              Runstead enforces strict isolation using PostgreSQL Row-Level Security, AES-256-GCM encrypted credential storage, and immutable audit logs. Each tenant organization retains sovereign authority over its customer data.
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="space-y-6 pt-6 text-sm text-muted-foreground leading-relaxed">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">1. Data Architecture & Multi-Tenant Separation</h3>
                <p>
                  Runstead operates as a multi-tenant hosting operating system. Each reseller tenant operates within an isolated logical partition enforced at the database layer through fail-closed PostgreSQL Row-Level Security (RLS). Customer records, billing histories, and service secrets cannot be accessed across tenant boundaries.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">2. Credential Encryption & Key Management</h3>
                <p>
                  All third-party credentials—including hosting provider API tokens, payment gateway secrets, registrar keys, and webhook signing secrets—are encrypted at rest using AES-256-GCM. Decryption keys are managed via environment variables and never exposed to client-side code.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">3. Compliance & Data Retention</h3>
                <p>
                  Runstead adheres to GDPR and modern privacy standards. Audit trails record privileged operations (such as role modifications, suspensions, and manual service provisions) with sensitive payload fields recursively redacted prior to persistence.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">4. Privacy Officer Contact</h3>
                <p>
                  For privacy inquiries, data subject access requests (SARs), or compliance documentation, contact our security office at {siteConfig.contactEmail}.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </MarketingLayout>
  );
}
