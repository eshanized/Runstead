'use client';

import React from 'react';
import type { StorefrontConfig, StorefrontSection, SectionType } from '@/lib/demo/types';
import { HeroSection } from './sections/hero-section';
import { DomainSearchSection } from './sections/domain-search-section';
import { FeaturedPlansSection } from './sections/featured-plans-section';
import { HostingCategoriesSection } from './sections/hosting-categories-section';
import { VpsHighlightsSection } from './sections/vps-highlights-section';
import { ManagedHostingSection } from './sections/managed-hosting-section';
import { FeaturesGridSection } from './sections/features-grid-section';
import { ProductComparisonSection } from './sections/product-comparison-section';
import { BenefitsSection } from './sections/benefits-section';
import { ResourceLimitsSection } from './sections/resource-limits-section';
import { FaqAccordionSection } from './sections/faq-accordion-section';
import { SupportCtaSection } from './sections/support-cta-section';
import { NewsletterSection } from './sections/newsletter-section';
import { CustomRichTextSection } from './sections/custom-rich-text-section';
import { PromotionalBannerSection } from './sections/promotional-banner-section';

interface SectionRendererProps {
  sections: StorefrontSection[];
  config: StorefrontConfig;
  isEditorPreview?: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
}

const sectionComponentMap: Record<
  SectionType,
  React.ComponentType<{ section: StorefrontSection; config: StorefrontConfig }>
> = {
  hero: HeroSection,
  domain_search: DomainSearchSection,
  featured_plans: FeaturedPlansSection,
  hosting_categories: HostingCategoriesSection,
  vps_highlights: VpsHighlightsSection,
  managed_hosting: ManagedHostingSection,
  product_comparison: ProductComparisonSection,
  features_grid: FeaturesGridSection,
  benefits: BenefitsSection,
  resource_limits: ResourceLimitsSection,
  faq_accordion: FaqAccordionSection,
  support_cta: SupportCtaSection,
  newsletter_cta: NewsletterSection,
  announcement_banner: PromotionalBannerSection,
  custom_rich_text: CustomRichTextSection,
  promotional_banner: PromotionalBannerSection,
};

export function SectionRenderer({
  sections,
  config,
  isEditorPreview = false,
  selectedSectionId = null,
  onSelectSection,
}: SectionRendererProps) {
  // Sort sections by order
  const sorted = [...sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col">
      {sorted.map((section) => {
        const Component = sectionComponentMap[section.type];
        if (!Component) return null;

        const isSelected = isEditorPreview && selectedSectionId === section.id;

        return (
          <div
            key={section.id}
            id={section.id}
            onClick={() => {
              if (isEditorPreview && onSelectSection) {
                onSelectSection(section.id);
              }
            }}
            className={`relative transition-all ${
              isEditorPreview
                ? `cursor-pointer hover:ring-2 hover:ring-blue-400/60 ${
                    isSelected ? 'ring-2 ring-blue-600 shadow-md z-10' : ''
                  }`
                : ''
            }`}
          >
            {isEditorPreview && (
              <div
                className={`absolute top-2 left-2 z-20 rounded bg-slate-900/90 text-[10px] font-mono text-white px-2 py-0.5 pointer-events-none transition-opacity ${
                  isSelected ? 'opacity-100 bg-blue-600' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {section.title || section.type}
              </div>
            )}
            <Component section={section} config={config} />
          </div>
        );
      })}
    </div>
  );
}
