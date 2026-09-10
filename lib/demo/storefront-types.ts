import type { ProductType, BillingCycle } from './types.ts';

export type ThemePresetId =
  | 'modern-cloud'
  | 'minimal-studio'
  | 'enterprise-infra'
  | 'developer-cloud'
  | 'commerce-focus';

export type FontHeading = 'inter' | 'plus-jakarta' | 'space-grotesk' | 'outfit' | 'fira-code';
export type FontBody = 'inter' | 'plus-jakarta' | 'roboto' | 'fira-code' | 'system';
export type BorderRadiusPreset = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type ButtonStylePreset = 'rounded' | 'pill' | 'square' | 'outline-fill';
export type ContentWidthPreset = 'narrow' | 'normal' | 'wide' | 'full';
export type SpacingPreset = 'compact' | 'comfortable' | 'spacious';

export interface StorefrontThemeConfig {
  preset: ThemePresetId;
  primaryColor: string;
  accentColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  fontHeading: FontHeading;
  fontBody: FontBody;
  borderRadius: BorderRadiusPreset;
  buttonStyle: ButtonStylePreset;
  contentWidth: ContentWidthPreset;
  spacing: SpacingPreset;
}

export interface StorefrontBrandingConfig {
  businessName: string;
  legalName: string;
  tagline: string;
  email: string;
  phone: string;
  logoUrl?: string | null;
  logoText: string;
  logoAlt?: string;
  faviconUrl?: string | null;
  showPlatformAttribution: boolean;
  copyrightText: string;
}

export interface StorefrontNavItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  order: number;
  isExternal?: boolean;
}

export interface StorefrontHeaderConfig {
  sticky: boolean;
  announcementBar: {
    enabled: boolean;
    text: string;
    link?: string;
    dismissible: boolean;
  };
  navItems: StorefrontNavItem[];
  primaryCta: {
    text: string;
    href: string;
    visible: boolean;
  };
  secondaryCta: {
    text: string;
    href: string;
    visible: boolean;
  };
}

export interface StorefrontFooterColumn {
  id: string;
  title: string;
  links: { label: string; href: string }[];
}

export interface StorefrontFooterConfig {
  layout: 'simple' | 'columns' | 'centered';
  showContact: boolean;
  showSocials: boolean;
  socialLinks: {
    platform: 'twitter' | 'github' | 'linkedin' | 'discord';
    url: string;
    enabled: boolean;
  }[];
  columns: StorefrontFooterColumn[];
}

export interface StorefrontSeoConfig {
  pageTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  noIndex: boolean;
}

export type SectionType =
  | 'hero'
  | 'domain_search'
  | 'featured_plans'
  | 'hosting_categories'
  | 'vps_highlights'
  | 'managed_hosting'
  | 'product_comparison'
  | 'features_grid'
  | 'benefits'
  | 'resource_limits'
  | 'faq_accordion'
  | 'support_cta'
  | 'newsletter_cta'
  | 'announcement_banner'
  | 'custom_rich_text'
  | 'promotional_banner';

export interface StorefrontSection {
  id: string;
  type: SectionType;
  title: string;
  subtitle: string;
  enabled: boolean;
  order: number;
  settings: Record<string, any>;
}

export interface StorefrontPageConfig {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: 'built_in' | 'custom';
  visibleInNav: boolean;
  navOrder: number;
  seo?: {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    canonical?: string;
    noIndex?: boolean;
  };
  sections?: StorefrontSection[];
  customContent?: {
    leadParagraph?: string;
    blocks?: Array<{ heading: string; body: string }>;
  };
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productType: ProductType;
  billingCycle: BillingCycle;
  unitPrice: number;
  setupFee: number;
  domainName?: string | null;
  selectedAddons: { name: string; price: number }[];
  quantity: number;
}

/**
 * Extended Storefront configuration model.
 * Preserves top-level StorefrontSettings fields for backwards compatibility
 * while providing structured nested objects for theme, branding, header, footer, SEO, sections, and pages.
 */
export interface StorefrontConfig {
  // Legacy / top-level fields for direct compatibility
  businessName: string;
  tagline: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  email: string;
  phone: string;
  logoText: string;
  headline: string;
  displayedProductIds: string[];
  showProductPricing: boolean;

  // Extended configuration
  schemaVersion: number;
  theme: StorefrontThemeConfig;
  branding: StorefrontBrandingConfig;
  header: StorefrontHeaderConfig;
  footer: StorefrontFooterConfig;
  seo: StorefrontSeoConfig;
  sections: StorefrontSection[];
  pages: StorefrontPageConfig[];

  // Draft and publish metadata
  publishedAt: string | null;
  isDraftDirty?: boolean;
}
