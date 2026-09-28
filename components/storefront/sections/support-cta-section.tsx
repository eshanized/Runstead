'use client';

import Link from 'next/link';
import { Headphones, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface SupportCtaSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function SupportCtaSection({ section, config }: SupportCtaSectionProps) {
  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';

  const headline = settings.headline || 'Need technical assistance or custom configuration?';
  const description =
    settings.description ||
    'Our hosting engineering team is ready to assist with DNS setup, migration inquiries, or server guidance.';
  const primaryButtonText = settings.primaryButtonText || 'Open a Support Ticket';
  const primaryButtonHref = settings.primaryButtonHref || '/demo/storefront-preview/support';
  const secondaryButtonText = settings.secondaryButtonText || 'Browse Knowledge Base';
  const secondaryButtonHref = settings.secondaryButtonHref || '/demo/storefront-preview/knowledge-base';

  return (
    <section className="bg-slate-900 text-white py-16 sm:py-20 border-b border-slate-800">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md"
          style={{ backgroundColor: primaryColor }}
        >
          <Headphones className="h-6 w-6" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white max-w-2xl mx-auto">
          {headline}
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            asChild
            className="w-full sm:w-auto text-white text-xs font-semibold h-10 px-6 shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Link href={primaryButtonHref}>
              {primaryButtonText} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto border-slate-700 bg-slate-800 text-white hover:bg-slate-700 text-xs h-10 px-6"
          >
            <Link href={secondaryButtonHref}>
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              {secondaryButtonText}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
