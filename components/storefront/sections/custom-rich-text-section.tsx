'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface CustomRichTextSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function CustomRichTextSection({ section, config }: CustomRichTextSectionProps) {
  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';

  const heading = settings.heading || section.title || 'Custom Section Content';
  const body =
    settings.body ||
    section.subtitle ||
    'Provide customized text, technical explanations, or specialized hosting guarantees for your clients.';
  const calloutText = settings.calloutText || '';
  const buttonText = settings.buttonText || '';
  const buttonHref = settings.buttonHref || '/storefront/hosting';

  return (
    <section className="bg-white py-14 sm:py-20 border-b border-slate-100">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{heading}</h2>
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{body}</p>

        {calloutText && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900">
            {calloutText}
          </div>
        )}

        {buttonText && (
          <div className="pt-2">
            <Button
              asChild
              className="text-white text-xs font-semibold h-10 px-6 shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <Link href={buttonHref}>
                {buttonText} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
