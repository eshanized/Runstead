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
            eyebrow="Terms of Service (Demo Model)"
            title="SaaS Subscription & Evaluation Terms"
            description="Demonstration model of the proposed terms of service governing reseller subscriptions and platform operations."
          />

          <Alert>
            <AlertTitle>Demonstration Disclaimer</AlertTitle>
            <AlertDescription>
              Runstead is an interactive demonstration project created by {siteConfig.company}. These terms are provided for product demonstration and architectural evaluation purposes only. No commercial contracts are entered into via this site.
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="space-y-6 pt-6 text-sm text-muted-foreground leading-relaxed">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">1. Demonstration Scope & Boundaries</h3>
                <p>
                  All features, including SaaS plan selection, domain availability checks, payment simulations, server provisioning runs, and DNS changes, are strictly simulated within demo data. No real funds are transferred and no live servers are modified.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">2. Reseller Rights & Whitelabel Operations</h3>
                <p>
                  Under the proposed commercial model, subscribers to Runstead retain full ownership of their end-customer relationships, brand identity, custom domains, and storefront themes. Tonmoy Infrastructure operates as the underlying SaaS infrastructure provider.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">3. Acceptable Use</h3>
                <p>
                  The production platform will enforce strict anti-abuse policies across provisioned infrastructure, automated spam and phishing detection on customer DNS zones, and automated rate limiting on public storefront endpoints.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">4. Contact</h3>
                <p>
                  For feedback or inquiries regarding the investor demo, contact {siteConfig.contactEmail}.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </MarketingLayout>
  );
}
