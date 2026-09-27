'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface FaqAccordionSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function FaqAccordionSection({ section, config }: FaqAccordionSectionProps) {
  const settings = section.settings || {};
  const headline = settings.headline || 'Frequently Asked Questions';
  const subtitle =
    settings.subtitle || 'Everything you need to know about getting started, provisioning, and managing services';

  const faqs = settings.faqs || [
    {
      q: 'How fast is service provisioning after ordering?',
      a: 'Orders with confirmed simulated payment are provisioned automatically in seconds through our orchestration pipeline. You will receive active credentials immediately.',
    },
    {
      q: 'Can I change my billing cycle between monthly and annual?',
      a: 'Yes, you can switch your billing cycle at any time from your customer portal to take advantage of annual pricing discounts.',
    },
    {
      q: 'Can I connect a domain I already own elsewhere?',
      a: 'Absolutely. You can attach an external domain during checkout and point its nameservers or A record to your service IP.',
    },
    {
      q: 'Do you offer root access on VPS packages?',
      a: 'Yes, all Cloud VPS packages include full root access via SSH, customizable OS images, and power reboot controls.',
    },
    {
      q: 'How do automated backups work?',
      a: 'Daily snapshot backups are captured automatically. You can restore individual files or entire snapshots directly through the customer portal.',
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50">
            Support & Guidance
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{headline}</h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq: { q: string; a: string }, idx: number) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 transition-colors data-[state=open]:bg-white data-[state=open]:border-blue-200"
            >
              <AccordionTrigger className="text-left text-sm font-semibold text-slate-900 hover:no-underline py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-600 leading-relaxed pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
