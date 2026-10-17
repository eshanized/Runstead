import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { siteConfig } from '@/lib/config/site';

export default function TermsPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <SectionHeading
            align="left"
            eyebrow="Legal & Compliance"
            title="Terms of Service"
            description="Terms governing use of the Runstead hosting operating platform, APIs, infrastructure automation, and customer storefronts."
          />

          <Alert className="border-emerald-200 bg-emerald-50/50">
            <AlertTitle className="text-emerald-900 font-semibold">Production Platform Agreement</AlertTitle>
            <AlertDescription className="text-emerald-800 text-xs mt-1">
              Runstead operates an enterprise multi-tenant platform with Row-Level Security, automated lifecycle orchestration, and upstream provider integrations. These terms govern active reseller tenant accounts and services.
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="space-y-6 pt-6 text-sm text-muted-foreground leading-relaxed">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">1. Platform Services & Multi-Tenant Boundaries</h3>
                <p>
                  Runstead provides SaaS infrastructure, provisioning workers, DNS orchestration, and billing automation for hosting resellers. All customer and tenant data is isolated using PostgreSQL Row-Level Security and encrypted credential storage.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">2. Reseller Rights & Whitelabel Storefronts</h3>
                <p>
                  Subscribers to Runstead retain full commercial ownership of their end-customer accounts, brand identity, custom domains, and storefront pricing. Tonmoy Infrastructure operates as the underlying cloud infrastructure provider.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">3. Acceptable Use & Security</h3>
                <p>
                  Tenants are responsible for services provisioned under their account. Automated rate limiting, SSRF endpoint validation, and continuous audit logging are enforced across all public storefronts and management APIs.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">4. Contact & Inquiries</h3>
                <p>
                  For support or enterprise compliance inquiries, reach out to {siteConfig.contactEmail}.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </MarketingLayout>
  );
}
