export const siteConfig = {
  name: 'Runstead',
  tagline: 'The operating system for hosting businesses',
  description:
    'Start, operate, and grow a hosting business from one platform. Client management, billing, automation, domains, DNS, and white-label storefronts — without stitching together a dozen separate tools.',
  url: 'https://runstead.demo',
  ogImage: '/og.png',
  locale: 'en_US',
  type: 'website' as const,
  links: {
    twitter: 'https://twitter.com/runstead',
    github: 'https://github.com/eshanized/Runstead',
  },
  company: 'Tonmoy Infrastructure',
  contactEmail: 'hello@tonmoyinfrastructure.com',
  supportEmail: 'support@runstead.demo',
};

export type SiteConfig = typeof siteConfig;
