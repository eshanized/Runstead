'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, HelpCircle } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { pricingPlans, pricingFaq } from '@/lib/config/pricing';

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Pricing"
            title="Plans that scale with your hosting business"
            description="Start free with the Sandbox, upgrade as you grow. All prices are indicative assumptions for demonstration and require validation before launch."
          />
          <div className="mt-8 flex items-center justify-center gap-4">
            <Label htmlFor="billing-toggle" className="text-sm">Monthly</Label>
            <Switch id="billing-toggle" checked={annual} onCheckedChange={setAnnual} />
            <Label htmlFor="billing-toggle" className="text-sm">Annual</Label>
            <span className="text-xs font-medium text-success">Save ~20%</span>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {pricingPlans.map((plan) => {
              const price = annual ? plan.annualPrice : plan.monthlyPrice;
              return (
                <Card key={plan.name} className={plan.highlighted ? 'border-accent shadow-lg relative' : ''}>
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-foreground">
                      Most popular
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {price === null ? 'Custom' : price === 0 ? 'Free' : `$${price}`}
                      {price !== null && price !== 0 && (
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {price === null ? 'Contact us for a quote' : annual && price !== 0 ? 'billed annually' : 'billed monthly'}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground italic">{plan.suitableFor}</p>
                    <Button asChild className="mt-4 w-full" variant={plan.highlighted ? 'default' : 'outline'} size="sm">
                      <Link href={`/demo/launch?plan=${encodeURIComponent(plan.name)}`}>
                        {price === 0 ? 'Start free sandbox' : `Launch on ${plan.name}`}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Comparison" title="Compare plan features" />
          <div className="mt-12 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left font-medium text-muted-foreground">Feature</th>
                  {pricingPlans.map((p) => (
                    <th key={p.name} className="py-3 text-center font-semibold">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricingPlans[0].features.map((_, fi) => (
                  <tr key={fi} className="border-b">
                    <td className="py-3 text-left text-muted-foreground">
                      {pricingPlans[0].features[fi].label}
                    </td>
                    {pricingPlans.map((p) => (
                      <td key={p.name} className="py-3 text-center">
                        {p.features[fi]?.included ? (
                          <Check className="mx-auto h-4 w-4 text-success" />
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="FAQ" title="Pricing questions" />
          <Accordion type="single" collapsible className="mt-8">
            {pricingFaq.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          <Alert>
            <AlertTitle>Indicative pricing notice</AlertTitle>
            <AlertDescription>
              All prices shown on this page are indicative assumptions for demonstration purposes only.
              They do not constitute a commercial offer. Final pricing will be determined and published
              before the production launch and may differ from what is shown here.
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button asChild size="lg"><Link href="/demo">Explore the interactive demo <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
