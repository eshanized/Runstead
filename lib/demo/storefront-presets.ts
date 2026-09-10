import type {
  StorefrontConfig,
  StorefrontThemeConfig,
  StorefrontSection,
  StorefrontPageConfig,
  ThemePresetId,
  SectionType,
} from './storefront-types.ts';

export const RESERVED_PAGE_SLUGS = [
  '',
  'home',
  'hosting',
  'vps',
  'domains',
  'managed',
  'about',
  'contact',
  'support',
  'knowledge-base',
  'status',
  'privacy',
  'terms',
  'cart',
  'client',
  'pages',
  'api',
  'admin',
  'checkout',
];

export const themePresets: Record<ThemePresetId, StorefrontThemeConfig> = {
  'modern-cloud': {
    preset: 'modern-cloud',
    primaryColor: '#0f5fff',
    accentColor: '#00c896',
    secondaryColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    surfaceColor: '#f8fafc',
    textColor: '#0f172a',
    mutedColor: '#64748b',
    fontHeading: 'plus-jakarta',
    fontBody: 'inter',
    borderRadius: 'md',
    buttonStyle: 'rounded',
    contentWidth: 'normal',
    spacing: 'comfortable',
  },
  'minimal-studio': {
    preset: 'minimal-studio',
    primaryColor: '#0f172a',
    accentColor: '#f97316',
    secondaryColor: '#f8fafc',
    backgroundColor: '#ffffff',
    surfaceColor: '#ffffff',
    textColor: '#0f172a',
    mutedColor: '#64748b',
    fontHeading: 'outfit',
    fontBody: 'inter',
    borderRadius: 'none',
    buttonStyle: 'square',
    contentWidth: 'narrow',
    spacing: 'spacious',
  },
  'enterprise-infra': {
    preset: 'enterprise-infra',
    primaryColor: '#1e3a8a',
    accentColor: '#0284c7',
    secondaryColor: '#f0f9ff',
    backgroundColor: '#ffffff',
    surfaceColor: '#f8fafc',
    textColor: '#0f172a',
    mutedColor: '#475569',
    fontHeading: 'space-grotesk',
    fontBody: 'inter',
    borderRadius: 'sm',
    buttonStyle: 'rounded',
    contentWidth: 'wide',
    spacing: 'comfortable',
  },
  'developer-cloud': {
    preset: 'developer-cloud',
    primaryColor: '#10b981',
    accentColor: '#8b5cf6',
    secondaryColor: '#1e293b',
    backgroundColor: '#090d16',
    surfaceColor: '#111827',
    textColor: '#f8fafc',
    mutedColor: '#94a3b8',
    fontHeading: 'space-grotesk',
    fontBody: 'fira-code',
    borderRadius: 'lg',
    buttonStyle: 'pill',
    contentWidth: 'wide',
    spacing: 'compact',
  },
  'commerce-focus': {
    preset: 'commerce-focus',
    primaryColor: '#6366f1',
    accentColor: '#ec4899',
    secondaryColor: '#faf5ff',
    backgroundColor: '#ffffff',
    surfaceColor: '#fdf4ff',
    textColor: '#18181b',
    mutedColor: '#71717a',
    fontHeading: 'plus-jakarta',
    fontBody: 'inter',
    borderRadius: 'full',
    buttonStyle: 'pill',
    contentWidth: 'normal',
    spacing: 'comfortable',
  },
};

export const defaultSections: StorefrontSection[] = [
  {
    id: 'sec_hero',
    type: 'hero',
    title: 'Hero Section',
    subtitle: 'Primary landing banner and value proposition',
    enabled: true,
    order: 1,
    settings: {
      eyebrow: 'High-Performance Cloud Infrastructure',
      headline: 'Host smarter. Scale faster.',
      description:
        'Deploy web applications, manage domains, and scale virtual servers with enterprise-grade isolation, automated SSL, and NVMe-backed storage.',
      primaryCtaText: 'Explore Hosting Plans',
      primaryCtaHref: '/demo/storefront-preview/hosting',
      secondaryCtaText: 'Search Domains',
      secondaryCtaHref: '/demo/storefront-preview/domains',
      layoutVariant: 'centered', // 'centered' | 'split' | 'minimal'
      badgeText: 'Instant Automated Provisioning',
    },
  },
  {
    id: 'sec_domain_search',
    type: 'domain_search',
    title: 'Domain Search',
    subtitle: 'Instant domain lookup and TLD suggestion bar',
    enabled: true,
    order: 2,
    settings: {
      headline: 'Find your perfect domain name',
      subtitle: 'Deterministic availability lookup across 200+ top-level domains',
      inputPlaceholder: 'Find your ideal domain (e.g. nexthost-test.com)',
      featuredTlds: [
        { tld: '.com', price: 12.99 },
        { tld: '.io', price: 39.99 },
        { tld: '.net', price: 14.99 },
        { tld: '.dev', price: 18.99 },
        { tld: '.org', price: 13.99 },
      ],
    },
  },
  {
    id: 'sec_featured_plans',
    type: 'featured_plans',
    title: 'Featured Hosting Plans',
    subtitle: 'Core product tier cards with pricing and limits',
    enabled: true,
    order: 3,
    settings: {
      headline: 'Hosting plans built for every scale',
      subtitle: 'All plans include automated backups, free SSL certificates, and 99.9% uptime architecture',
      showBillingToggle: true,
      productIds: ['prod_001', 'prod_002', 'prod_003'],
      badgeForProduct: { prod_002: 'Most Popular' },
    },
  },
  {
    id: 'sec_categories',
    type: 'hosting_categories',
    title: 'Hosting Categories',
    subtitle: 'Category navigation cards for all service lines',
    enabled: true,
    order: 4,
    settings: {
      headline: 'Explore our infrastructure solutions',
      subtitle: 'From personal projects to high-traffic enterprise applications',
      categories: [
        {
          id: 'shared',
          title: 'Shared Hosting',
          desc: 'Fast, secure hosting with cPanel/Plesk and 1-click app installs',
          href: '/demo/storefront-preview/hosting',
          badge: 'From $4.99/mo',
        },
        {
          id: 'vps',
          title: 'Cloud VPS',
          desc: 'Dedicated virtual servers with full root access and scalable NVMe',
          href: '/demo/storefront-preview/vps',
          badge: 'From $19.99/mo',
        },
        {
          id: 'domains',
          title: 'Domain Marketplace',
          desc: 'Register, transfer, and configure DNS with global propagation',
          href: '/demo/storefront-preview/domains',
          badge: 'From $12.99/yr',
        },
        {
          id: 'managed',
          title: 'Managed WordPress & DNS',
          desc: 'Optimized caching, auto-updates, and resilient Anycast DNS',
          href: '/demo/storefront-preview/managed',
          badge: 'Managed Care',
        },
      ],
    },
  },
  {
    id: 'sec_vps_highlights',
    type: 'vps_highlights',
    title: 'VPS Highlights',
    subtitle: 'Compute specifications and developer server controls',
    enabled: true,
    order: 5,
    settings: {
      headline: 'Virtual Private Servers with raw performance',
      subtitle: 'Dedicated CPU, RAM, and SSD storage without noisy neighbor contention',
      vpsProductIds: ['prod_003', 'prod_004'],
    },
  },
  {
    id: 'sec_features_grid',
    type: 'features_grid',
    title: 'Features Grid',
    subtitle: 'Technical capabilities and infrastructure qualities',
    enabled: true,
    order: 6,
    settings: {
      headline: 'Engineered for reliability and speed',
      subtitle: 'Clear, verifiable hosting infrastructure without unsupported marketing claims',
      features: [
        {
          icon: 'Zap',
          title: 'NVMe Solid-State Storage',
          description: 'High IOPS storage pools deliver fast database reads and swift application boot times.',
        },
        {
          icon: 'Shield',
          title: 'Automated TLS / SSL',
          description: 'Free automatic SSL certificate provisioning and renewal for all domains and subdomains.',
        },
        {
          icon: 'Server',
          title: 'Containerized Isolation',
          description: 'Tenant workloads run in isolated execution environments with dedicated memory boundaries.',
        },
        {
          icon: 'Globe',
          title: 'Global DNS Routing',
          description: 'Anycast DNS network provides low latency resolution and high lookup availability.',
        },
        {
          icon: 'RotateCcw',
          title: 'Scheduled Snapshot Backups',
          description: 'Daily automated retention with one-click restore points available directly in customer portal.',
        },
        {
          icon: 'Headphones',
          title: 'Responsive Helpdesk Support',
          description: 'Ticketing system staffed by hosting specialists for configuration and technical guidance.',
        },
      ],
    },
  },
  {
    id: 'sec_comparison',
    type: 'product_comparison',
    title: 'Plan Comparison',
    subtitle: 'Side-by-side specification comparison matrix',
    enabled: true,
    order: 7,
    settings: {
      headline: 'Compare hosting tiers side-by-side',
      subtitle: 'Find the exact resource specifications matching your workload requirements',
    },
  },
  {
    id: 'sec_faq',
    type: 'faq_accordion',
    title: 'Frequently Asked Questions',
    subtitle: 'Common hosting, billing, and technical questions',
    enabled: true,
    order: 8,
    settings: {
      headline: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about getting started and managing your hosting',
      faqs: [
        {
          q: 'How fast is service provisioning after ordering?',
          a: 'Orders with confirmed payment are provisioned automatically through our orchestration pipeline in seconds. You will receive active credentials immediately.',
        },
        {
          q: 'Can I change my billing cycle between monthly and annual?',
          a: 'Yes, you can upgrade your billing cycle at any time from your customer portal to take advantage of annual pricing discounts.',
        },
        {
          q: 'Can I connect a domain I already own elsewhere?',
          a: 'Absolutely. You can attach an external domain during checkout and simply point its nameservers or A records to your service IP.',
        },
        {
          q: 'Do you offer root access on VPS packages?',
          a: 'Yes, all Cloud VPS packages include full root access via SSH, customizable OS images, and power reboot controls.',
        },
        {
          q: 'How do backups work for shared hosting and VPS?',
          a: 'Daily snapshot backups are captured automatically. You can restore individual files, MySQL databases, or entire disk snapshots through the management portal.',
        },
      ],
    },
  },
  {
    id: 'sec_support_cta',
    type: 'support_cta',
    title: 'Customer Support CTA',
    subtitle: 'Direct helpdesk contact and knowledge base callout',
    enabled: true,
    order: 9,
    settings: {
      headline: 'Need technical assistance or custom configuration?',
      description: 'Our support team is ready to assist with migrations, DNS records, or hosting advice.',
      primaryButtonText: 'Open a Support Ticket',
      primaryButtonHref: '/demo/storefront-preview/support',
      secondaryButtonText: 'Browse Knowledge Base',
      secondaryButtonHref: '/demo/storefront-preview/knowledge-base',
    },
  },
  {
    id: 'sec_newsletter',
    type: 'newsletter_cta',
    title: 'Newsletter Signup',
    subtitle: 'Hosting updates and maintenance announcements',
    enabled: true,
    order: 10,
    settings: {
      headline: 'Stay updated on infrastructure & security',
      description: 'Subscribe to receive maintenance schedules, hosting optimization tips, and product updates.',
      buttonText: 'Subscribe',
      disclaimer: 'Simulated newsletter subscription for demo demonstration.',
    },
  },
];

export const defaultPages: StorefrontPageConfig[] = [
  {
    id: 'page_home',
    slug: 'home',
    title: 'Home',
    description: 'Storefront home page featuring headline, domain search, and key services',
    type: 'built_in',
    visibleInNav: true,
    navOrder: 1,
    seo: {
      title: 'Reliable Cloud Hosting & Domain Registration',
      description: 'High-performance shared hosting, Cloud VPS, and domain services.',
    },
  },
  {
    id: 'page_hosting',
    slug: 'hosting',
    title: 'Hosting Plans',
    description: 'Complete shared hosting catalog with billing cycle options',
    type: 'built_in',
    visibleInNav: true,
    navOrder: 2,
    seo: {
      title: 'Shared Hosting Plans',
      description: 'Fast, secure shared hosting with SSD storage and free SSL.',
    },
  },
  {
    id: 'page_vps',
    slug: 'vps',
    title: 'Cloud VPS',
    description: 'Virtual private servers with dedicated compute and root access',
    type: 'built_in',
    visibleInNav: true,
    navOrder: 3,
    seo: {
      title: 'Cloud VPS Servers',
      description: 'High-performance virtual private servers with dedicated RAM and CPU.',
    },
  },
  {
    id: 'page_domains',
    slug: 'domains',
    title: 'Domains',
    description: 'Domain marketplace with availability check and TLD catalog',
    type: 'built_in',
    visibleInNav: true,
    navOrder: 4,
    seo: {
      title: 'Domain Registration & Marketplace',
      description: 'Find and register your ideal domain name across popular TLDs.',
    },
  },
  {
    id: 'page_managed',
    slug: 'managed',
    title: 'Managed Services',
    description: 'Managed WordPress, Managed DNS, and Backup Solutions',
    type: 'built_in',
    visibleInNav: true,
    navOrder: 5,
    seo: {
      title: 'Managed Hosting & DNS Services',
      description: 'Turnkey managed services with automatic patching and DNS optimization.',
    },
  },
  {
    id: 'page_about',
    slug: 'about',
    title: 'About Us',
    description: 'Company background, infrastructure philosophy, and commitments',
    type: 'built_in',
    visibleInNav: false,
    navOrder: 6,
    seo: {
      title: 'About Our Hosting Platform',
      description: 'Learn about our hosting philosophy and technical infrastructure.',
    },
  },
  {
    id: 'page_contact',
    slug: 'contact',
    title: 'Contact',
    description: 'Get in touch with sales, billing, and technical support',
    type: 'built_in',
    visibleInNav: true,
    navOrder: 7,
    seo: {
      title: 'Contact Us',
      description: 'Get in touch with our team for questions, sales, or support.',
    },
  },
  {
    id: 'page_support',
    slug: 'support',
    title: 'Support',
    description: 'Technical helpdesk, ticket creation, and support channels',
    type: 'built_in',
    visibleInNav: false,
    navOrder: 8,
    seo: {
      title: 'Customer Support',
      description: 'Submit technical inquiries and get help with your hosting services.',
    },
  },
  {
    id: 'page_kb',
    slug: 'knowledge-base',
    title: 'Knowledge Base',
    description: 'Self-service technical guides, tutorials, and documentation',
    type: 'built_in',
    visibleInNav: false,
    navOrder: 9,
    seo: {
      title: 'Hosting Knowledge Base & Guides',
      description: 'Step-by-step guides for DNS setup, SSL configuration, and server administration.',
    },
  },
  {
    id: 'page_status',
    slug: 'status',
    title: 'System Status',
    description: 'Simulated real-time status of compute clusters and network services',
    type: 'built_in',
    visibleInNav: false,
    navOrder: 10,
    seo: {
      title: 'Platform System Status',
      description: 'Simulated system uptime and operational status indicators.',
    },
  },
  {
    id: 'page_privacy',
    slug: 'privacy',
    title: 'Privacy Policy',
    description: 'Customer privacy notice and data handling practices (illustrative)',
    type: 'built_in',
    visibleInNav: false,
    navOrder: 11,
    seo: {
      title: 'Privacy Policy',
      description: 'Illustrative privacy and data protection terms for demo simulation.',
    },
  },
  {
    id: 'page_terms',
    slug: 'terms',
    title: 'Terms of Service',
    description: 'Hosting terms of service and acceptable use policy (illustrative)',
    type: 'built_in',
    visibleInNav: false,
    navOrder: 12,
    seo: {
      title: 'Terms of Service',
      description: 'Illustrative terms of service and acceptable use guidelines.',
    },
  },
];

export const defaultStorefrontConfig: StorefrontConfig = {
  // Legacy / top-level compatibility
  businessName: 'CloudVista Hosting',
  tagline: 'Reliable hosting for growing businesses',
  description: 'Premium hosting services with SSD storage, automated SSL, and global DNS routing.',
  primaryColor: '#0f5fff',
  accentColor: '#00c896',
  email: 'sales@cloudvista.host',
  phone: '+1 888 555 0100',
  logoText: 'CV',
  headline: 'Host smarter. Scale faster.',
  displayedProductIds: ['prod_001', 'prod_002', 'prod_003', 'prod_004'],
  showProductPricing: true,

  // Extended
  schemaVersion: 2,
  theme: themePresets['modern-cloud'],
  branding: {
    businessName: 'CloudVista Hosting',
    legalName: 'CloudVista Hosting LLC',
    tagline: 'Reliable hosting for growing businesses',
    email: 'sales@cloudvista.host',
    phone: '+1 888 555 0100',
    logoUrl: null,
    logoText: 'CV',
    logoAlt: 'CloudVista Hosting Logo',
    faviconUrl: null,
    showPlatformAttribution: false,
    copyrightText: `© ${new Date().getFullYear()} CloudVista Hosting LLC. All rights reserved.`,
  },
  header: {
    sticky: true,
    announcementBar: {
      enabled: true,
      text: '🎉 Annual plans include 2 months free + automated SSL certificate provisioning.',
      link: '/demo/storefront-preview/hosting',
      dismissible: true,
    },
    navItems: [
      { id: 'nav_hosting', label: 'Hosting Plans', href: '/demo/storefront-preview/hosting', visible: true, order: 1 },
      { id: 'nav_vps', label: 'Cloud VPS', href: '/demo/storefront-preview/vps', visible: true, order: 2 },
      { id: 'nav_domains', label: 'Domains', href: '/demo/storefront-preview/domains', visible: true, order: 3 },
      { id: 'nav_managed', label: 'Managed Services', href: '/demo/storefront-preview/managed', visible: true, order: 4 },
      { id: 'nav_contact', label: 'Contact', href: '/demo/storefront-preview/contact', visible: true, order: 5 },
    ],
    primaryCta: {
      text: 'Get Started',
      href: '/demo/storefront-preview/hosting',
      visible: true,
    },
    secondaryCta: {
      text: 'Client Portal',
      href: '/demo/storefront-preview/client/login',
      visible: true,
    },
  },
  footer: {
    layout: 'columns',
    showContact: true,
    showSocials: true,
    socialLinks: [
      { platform: 'twitter', url: 'https://twitter.com', enabled: true },
      { platform: 'github', url: 'https://github.com', enabled: true },
      { platform: 'linkedin', url: 'https://linkedin.com', enabled: true },
      { platform: 'discord', url: 'https://discord.com', enabled: false },
    ],
    columns: [
      {
        id: 'col_products',
        title: 'Hosting & Cloud',
        links: [
          { label: 'Shared Hosting', href: '/demo/storefront-preview/hosting' },
          { label: 'Cloud VPS', href: '/demo/storefront-preview/vps' },
          { label: 'Domain Search', href: '/demo/storefront-preview/domains' },
          { label: 'Domain Transfer', href: '/demo/storefront-preview/domains/transfer' },
          { label: 'Managed WordPress', href: '/demo/storefront-preview/managed' },
        ],
      },
      {
        id: 'col_company',
        title: 'Company',
        links: [
          { label: 'About Us', href: '/demo/storefront-preview/about' },
          { label: 'Contact', href: '/demo/storefront-preview/contact' },
          { label: 'System Status', href: '/demo/storefront-preview/status' },
          { label: 'Privacy Policy', href: '/demo/storefront-preview/privacy' },
          { label: 'Terms of Service', href: '/demo/storefront-preview/terms' },
        ],
      },
      {
        id: 'col_support',
        title: 'Support & Portal',
        links: [
          { label: 'Client Login', href: '/demo/storefront-preview/client/login' },
          { label: 'Help Desk', href: '/demo/storefront-preview/support' },
          { label: 'Knowledge Base', href: '/demo/storefront-preview/knowledge-base' },
          { label: 'Shopping Cart', href: '/demo/storefront-preview/cart' },
        ],
      },
    ],
  },
  seo: {
    pageTitle: 'CloudVista Hosting — High-Performance Cloud & Domains',
    metaDescription: 'Deploy reliable shared hosting, scalable Cloud VPS, and secure domain names.',
    noIndex: true, // Demo storefront defaults to noIndex
  },
  sections: defaultSections,
  pages: defaultPages,
  publishedAt: new Date().toISOString(),
  isDraftDirty: false,
};

export function isValidCustomSlug(slug: string): { valid: boolean; error?: string } {
  const clean = slug.trim().toLowerCase();
  if (!clean) return { valid: false, error: 'Page slug cannot be empty.' };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean)) {
    return { valid: false, error: 'Slug may only contain lowercase letters, numbers, and hyphens.' };
  }
  if (RESERVED_PAGE_SLUGS.includes(clean)) {
    return { valid: false, error: `"${clean}" is a reserved system route and cannot be used for custom pages.` };
  }
  return { valid: true };
}

export function sanitizeColor(hex: string, fallback: string = '#0f5fff'): string {
  if (!hex || typeof hex !== 'string') return fallback;
  const clean = hex.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(clean)) {
    return clean;
  }
  return fallback;
}

/**
 * Migrate any raw storefront data (legacy or partial) into a full StorefrontConfig.
 */
export function migrateStorefrontConfig(raw: any): StorefrontConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultStorefrontConfig };
  }

  const businessName = raw.businessName || defaultStorefrontConfig.businessName;
  const primaryColor = sanitizeColor(raw.primaryColor, defaultStorefrontConfig.primaryColor);
  const accentColor = sanitizeColor(raw.accentColor, defaultStorefrontConfig.accentColor);
  const headline = raw.headline || defaultStorefrontConfig.headline;
  const logoText = raw.logoText || businessName.slice(0, 2).toUpperCase() || 'CV';

  // Merge theme
  const presetKey: ThemePresetId =
    raw.theme && raw.theme.preset && themePresets[raw.theme.preset as ThemePresetId]
      ? (raw.theme.preset as ThemePresetId)
      : 'modern-cloud';

  const baseTheme = themePresets[presetKey];
  const mergedTheme: StorefrontThemeConfig = {
    ...baseTheme,
    ...(raw.theme || {}),
    primaryColor,
    accentColor,
  };

  // Merge branding
  const mergedBranding = {
    ...defaultStorefrontConfig.branding,
    businessName,
    email: raw.email || defaultStorefrontConfig.email,
    phone: raw.phone || defaultStorefrontConfig.phone,
    tagline: raw.tagline || defaultStorefrontConfig.tagline,
    logoText,
    ...(raw.branding || {}),
  };

  // Merge header
  const mergedHeader = {
    ...defaultStorefrontConfig.header,
    ...(raw.header || {}),
    navItems: Array.isArray(raw.header?.navItems) && raw.header.navItems.length > 0
      ? raw.header.navItems
      : defaultStorefrontConfig.header.navItems,
  };

  // Merge footer
  const mergedFooter = {
    ...defaultStorefrontConfig.footer,
    ...(raw.footer || {}),
    columns: Array.isArray(raw.footer?.columns) && raw.footer.columns.length > 0
      ? raw.footer.columns
      : defaultStorefrontConfig.footer.columns,
  };

  // Merge sections
  const mergedSections: StorefrontSection[] = Array.isArray(raw.sections) && raw.sections.length > 0
    ? raw.sections.map((s: any, idx: number) => ({
        id: s.id || `sec_${idx}`,
        type: s.type || 'hero',
        title: s.title || `Section ${idx + 1}`,
        subtitle: s.subtitle || '',
        enabled: s.enabled !== undefined ? Boolean(s.enabled) : true,
        order: typeof s.order === 'number' ? s.order : idx + 1,
        settings: s.settings || {},
      }))
    : defaultSections;

  // Merge pages
  const mergedPages: StorefrontPageConfig[] = Array.isArray(raw.pages) && raw.pages.length > 0
    ? raw.pages.map((p: any, idx: number) => ({
        id: p.id || `page_${idx}`,
        slug: p.slug || `page-${idx}`,
        title: p.title || 'Page',
        description: p.description || '',
        type: p.type === 'custom' ? 'custom' : 'built_in',
        visibleInNav: Boolean(p.visibleInNav),
        navOrder: typeof p.navOrder === 'number' ? p.navOrder : idx + 1,
        seo: p.seo || {},
        sections: p.sections,
        customContent: p.customContent,
      }))
    : defaultPages;

  return {
    businessName,
    tagline: raw.tagline || defaultStorefrontConfig.tagline,
    description: raw.description || defaultStorefrontConfig.description,
    primaryColor,
    accentColor,
    email: raw.email || defaultStorefrontConfig.email,
    phone: raw.phone || defaultStorefrontConfig.phone,
    logoText,
    headline,
    displayedProductIds: Array.isArray(raw.displayedProductIds)
      ? raw.displayedProductIds
      : defaultStorefrontConfig.displayedProductIds,
    showProductPricing: raw.showProductPricing !== undefined ? Boolean(raw.showProductPricing) : true,

    schemaVersion: 2,
    theme: mergedTheme,
    branding: mergedBranding,
    header: mergedHeader,
    footer: mergedFooter,
    seo: {
      ...defaultStorefrontConfig.seo,
      ...(raw.seo || {}),
    },
    sections: mergedSections,
    pages: mergedPages,
    publishedAt: raw.publishedAt || new Date().toISOString(),
    isDraftDirty: Boolean(raw.isDraftDirty),
  };
}

export function createDefaultSection(type: SectionType, order: number = 1): StorefrontSection {
  const id = `sec_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  switch (type) {
    case 'hero':
      return {
        id,
        type: 'hero',
        title: 'Hero Section',
        subtitle: 'Primary landing banner and value proposition',
        enabled: true,
        order,
        settings: {
          eyebrow: 'High-Performance Cloud Infrastructure',
          headline: 'Host smarter. Scale faster.',
          description:
            'Deploy web applications, manage domains, and scale virtual servers with enterprise-grade isolation, automated SSL, and NVMe-backed storage.',
          primaryCtaText: 'Explore Hosting Plans',
          primaryCtaHref: '/demo/storefront-preview/hosting',
          secondaryCtaText: 'Search Domains',
          secondaryCtaHref: '/demo/storefront-preview/domains',
          layoutVariant: 'centered',
          badgeText: 'Instant Automated Provisioning',
        },
      };
    case 'domain_search':
      return {
        id,
        type: 'domain_search',
        title: 'Domain Search',
        subtitle: 'Instant domain lookup and TLD suggestion bar',
        enabled: true,
        order,
        settings: {
          headline: 'Find your perfect domain name',
          subtitle: 'Deterministic availability lookup across 200+ top-level domains',
          inputPlaceholder: 'Find your ideal domain (e.g. nexthost-test.com)',
          featuredTlds: [
            { tld: '.com', price: 12.99 },
            { tld: '.io', price: 39.99 },
            { tld: '.net', price: 14.99 },
            { tld: '.dev', price: 18.99 },
            { tld: '.org', price: 13.99 },
          ],
        },
      };
    case 'featured_plans':
      return {
        id,
        type: 'featured_plans',
        title: 'Featured Hosting Plans',
        subtitle: 'Core product tier cards with pricing and limits',
        enabled: true,
        order,
        settings: {
          headline: 'Hosting plans built for every scale',
          subtitle: 'All plans include automated backups, free SSL certificates, and 99.9% uptime architecture',
          showBillingToggle: true,
          productIds: ['prod_001', 'prod_002', 'prod_003'],
          badgeForProduct: { prod_002: 'Most Popular' },
        },
      };
    case 'hosting_categories':
      return {
        id,
        type: 'hosting_categories',
        title: 'Hosting Categories',
        subtitle: 'Category navigation cards for all service lines',
        enabled: true,
        order,
        settings: {
          headline: 'Explore our infrastructure solutions',
          subtitle: 'From personal projects to high-traffic enterprise applications',
          categories: [
            {
              id: 'shared',
              title: 'Shared Hosting',
              desc: 'Fast, secure hosting with cPanel/Plesk and 1-click app installs',
              href: '/demo/storefront-preview/hosting',
              badge: 'From $4.99/mo',
            },
            {
              id: 'vps',
              title: 'Cloud VPS',
              desc: 'Dedicated virtual servers with full root access and scalable NVMe',
              href: '/demo/storefront-preview/vps',
              badge: 'From $19.99/mo',
            },
            {
              id: 'domains',
              title: 'Domain Marketplace',
              desc: 'Register, transfer, and configure DNS with global propagation',
              href: '/demo/storefront-preview/domains',
              badge: 'From $12.99/yr',
            },
            {
              id: 'managed',
              title: 'Managed WordPress & DNS',
              desc: 'Optimized caching, auto-updates, and resilient Anycast DNS',
              href: '/demo/storefront-preview/managed',
              badge: 'Managed Care',
            },
          ],
        },
      };
    case 'vps_highlights':
      return {
        id,
        type: 'vps_highlights',
        title: 'VPS Highlights',
        subtitle: 'Compute specifications and developer server controls',
        enabled: true,
        order,
        settings: {
          headline: 'Virtual Private Servers with raw performance',
          subtitle: 'Dedicated CPU, RAM, and SSD storage without noisy neighbor contention',
          vpsProductIds: ['prod_003', 'prod_004'],
        },
      };
    case 'managed_hosting':
      return {
        id,
        type: 'managed_hosting',
        title: 'Managed Hosting',
        subtitle: 'Turnkey server maintenance and WordPress optimization',
        enabled: true,
        order,
        settings: {
          headline: 'Worry-free managed infrastructure',
          subtitle: 'Let our team handle automated updates, security scans, and continuous performance tuning',
        },
      };
    case 'features_grid':
      return {
        id,
        type: 'features_grid',
        title: 'Features Grid',
        subtitle: 'Technical capabilities and infrastructure qualities',
        enabled: true,
        order,
        settings: {
          headline: 'Engineered for reliability and speed',
          subtitle: 'Clear, verifiable hosting infrastructure without unsupported marketing claims',
          features: [
            {
              icon: 'Zap',
              title: 'NVMe Solid-State Storage',
              description: 'High IOPS storage pools deliver fast database reads and swift application boot times.',
            },
            {
              icon: 'Shield',
              title: 'Automated TLS / SSL',
              description: 'Free automatic SSL certificate provisioning and renewal for all domains and subdomains.',
            },
            {
              icon: 'Server',
              title: 'Containerized Isolation',
              description: 'Tenant workloads run in isolated execution environments with dedicated memory boundaries.',
            },
            {
              icon: 'Globe',
              title: 'Global DNS Routing',
              description: 'Anycast DNS network provides low latency resolution and high lookup availability.',
            },
          ],
        },
      };
    case 'benefits':
      return {
        id,
        type: 'benefits',
        title: 'Platform Benefits',
        subtitle: 'Developer-friendly features and operational peace of mind',
        enabled: true,
        order,
        settings: {
          headline: 'Built for developers and growing businesses',
          subtitle: 'Every service comes with automated tooling and straightforward management',
        },
      };
    case 'resource_limits':
      return {
        id,
        type: 'resource_limits',
        title: 'Resource Allocation & Limits',
        subtitle: 'Honest resource transparency without overselling',
        enabled: true,
        order,
        settings: {
          headline: 'Predictable Resources, Zero Overselling',
          subtitle: 'Guaranteed RAM, I/O rates, and CPU cores for uninterrupted hosting performance',
        },
      };
    case 'product_comparison':
      return {
        id,
        type: 'product_comparison',
        title: 'Plan Comparison',
        subtitle: 'Side-by-side specification comparison matrix',
        enabled: true,
        order,
        settings: {
          headline: 'Compare hosting tiers side-by-side',
          subtitle: 'Find the exact resource specifications matching your workload requirements',
        },
      };
    case 'faq_accordion':
      return {
        id,
        type: 'faq_accordion',
        title: 'Frequently Asked Questions',
        subtitle: 'Common hosting, billing, and technical questions',
        enabled: true,
        order,
        settings: {
          headline: 'Frequently Asked Questions',
          subtitle: 'Everything you need to know about getting started and managing your hosting',
          faqs: [
            {
              q: 'How fast is service provisioning after ordering?',
              a: 'Orders with confirmed payment are provisioned automatically through our orchestration pipeline in seconds. Credentials are made available immediately.',
            },
            {
              q: 'Can I connect a domain I already own elsewhere?',
              a: 'Yes. You can attach an external domain during checkout and point its nameservers to your service IP.',
            },
            {
              q: 'How do backups work for my hosting account?',
              a: 'Daily snapshot backups are captured automatically and stored offsite with one-click restore points available in your client portal.',
            },
          ],
        },
      };
    case 'support_cta':
      return {
        id,
        type: 'support_cta',
        title: 'Support Callout',
        subtitle: 'Direct helpdesk and knowledge base access',
        enabled: true,
        order,
        settings: {
          headline: 'Need technical assistance or custom configuration?',
          description: 'Our support team is ready to assist with migrations, DNS records, or hosting advice.',
          primaryButtonText: 'Open a Support Ticket',
          primaryButtonHref: '/demo/storefront-preview/support',
          secondaryButtonText: 'Browse Knowledge Base',
          secondaryButtonHref: '/demo/storefront-preview/knowledge-base',
        },
      };
    case 'newsletter_cta':
      return {
        id,
        type: 'newsletter_cta',
        title: 'Newsletter Signup',
        subtitle: 'Hosting updates and maintenance announcements',
        enabled: true,
        order,
        settings: {
          headline: 'Stay updated on infrastructure & security',
          description: 'Subscribe to receive maintenance schedules, hosting optimization tips, and product updates.',
          buttonText: 'Subscribe',
          disclaimer: 'Simulated newsletter subscription for demo demonstration.',
        },
      };
    case 'promotional_banner':
    case 'announcement_banner':
      return {
        id,
        type,
        title: 'Promotional Banner',
        subtitle: 'Highlight special offers or service announcements',
        enabled: true,
        order,
        settings: {
          badge: 'Limited Time Offer',
          headline: 'Save 20% on Annual Cloud VPS Deployments',
          description:
            'Lock in flat predictable pricing with free setup, automated daily backups, and dedicated vCPU resources.',
          ctaText: 'Claim Offer',
          ctaHref: '/demo/storefront-preview/vps',
        },
      };
    case 'custom_rich_text':
      return {
        id,
        type: 'custom_rich_text',
        title: 'Custom Content Block',
        subtitle: 'Rich text and tailored marketing content',
        enabled: true,
        order,
        settings: {
          heading: 'Enterprise SLAs and High-Availability Architecture',
          body: 'All physical nodes are connected to redundant dual 10Gbps uplinks with automated BGP failover. Data is mirrored across distributed Ceph NVMe storage clusters for instant redundancy without single points of failure.',
          calloutText: 'Backed by our transparent status dashboard and dedicated enterprise onboarding team.',
          buttonText: 'Contact Enterprise Sales',
          buttonHref: '/demo/storefront-preview/contact',
        },
      };
    default:
      return {
        id,
        type: 'custom_rich_text',
        title: 'Custom Content',
        subtitle: '',
        enabled: true,
        order,
        settings: {},
      };
  }
}

