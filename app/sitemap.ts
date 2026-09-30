import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/site';
import { solutions } from '@/lib/config/solutions';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/platform',
    '/platform/billing',
    '/platform/automation',
    '/platform/domains',
    '/platform/hosting',
    '/solutions',
    ...solutions.map((s) => `/solutions/${s.slug}`),
    '/pricing',
    '/integrations',
    '/security',
    '/roadmap',
    '/about',
    '/contact',
    '/demo',
  ];

  const now = new Date();

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: (route === '' ? 'daily' : 'weekly') as 'daily' | 'weekly',
    priority: route === '' ? 1.0 : route.startsWith('/demo') ? 0.9 : 0.8,
  }));
}
