import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/demo/overview',
          '/demo/customers',
          '/demo/products',
          '/demo/orders',
          '/demo/services',
          '/demo/domains',
          '/demo/dns',
          '/demo/invoices',
          '/demo/tickets',
          '/demo/analytics',
          '/demo/storefront',
          '/demo/integrations',
          '/demo/settings',
          '/demo/onboarding',
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
