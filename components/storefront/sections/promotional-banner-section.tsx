'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface PromotionalBannerSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function PromotionalBannerSection({ section, config }: PromotionalBannerSectionProps) {
  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';
  const accentColor = config.accentColor || '#00c896';

  const badge = settings.badge || 'Limited Time Offer';
  const headline = settings.headline || 'Save 20% on Annual Cloud VPS Deployments';
  const description =
    settings.description ||
    'Lock in flat predictable pricing with free setup, automated daily backups, and dedicated vCPU resources.';
  const ctaText = settings.ctaText || 'Claim Offer';
  const ctaHref = settings.ctaHref || '/storefront/vps';

  return (
    <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-14 sm:py-16 border-b border-slate-800">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-900"
          style={{ backgroundColor: accentColor }}
        >
          <Sparkles className="h-3 w-3" />
          {badge}
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white max-w-2xl mx-auto">
          {headline}
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          {description}
        </p>

        <div className="pt-2">
          <Button
            asChild
            className="text-white text-xs font-semibold h-10 px-6 shadow-md hover:opacity-95"
            style={{ backgroundColor: primaryColor }}
          >
            <Link href={ctaHref}>
              {ctaText} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
