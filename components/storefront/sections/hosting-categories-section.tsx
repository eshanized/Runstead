'use client';

import Link from 'next/link';
import { Server, Cpu, Globe, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface HostingCategoriesSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function HostingCategoriesSection({ section, config }: HostingCategoriesSectionProps) {
  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';

  const headline = settings.headline || 'Explore our infrastructure solutions';
  const subtitle = settings.subtitle || 'From personal web projects to dedicated high-traffic compute clusters';

  const categories = settings.categories || [
    {
      id: 'shared',
      icon: Server,
      title: 'Shared Hosting',
      desc: 'High-speed web hosting with SSD storage, free automated SSL, and 1-click app installer.',
      href: '/demo/storefront-preview/hosting',
      badge: 'From $4.99/mo',
    },
    {
      id: 'vps',
      icon: Cpu,
      title: 'Cloud VPS',
      desc: 'Dedicated virtual servers with full root access, dedicated vCPU cores, and NVMe SSD disks.',
      href: '/demo/storefront-preview/vps',
      badge: 'From $19.99/mo',
    },
    {
      id: 'domains',
      icon: Globe,
      title: 'Domain Marketplace',
      desc: 'Register and manage 200+ TLDs with Anycast DNS routing and instant nameserver updates.',
      href: '/demo/storefront-preview/domains',
      badge: 'From $12.99/yr',
    },
    {
      id: 'managed',
      icon: Sparkles,
      title: 'Managed WordPress & DNS',
      desc: 'Turnkey WordPress optimization, automated core & plugin updates, and Anycast DNS resolution.',
      href: '/demo/storefront-preview/managed',
      badge: 'Managed Care',
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-20 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50">
            Catalog Categories
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{headline}</h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat: any) => {
            const IconComponent = cat.icon || Server;
            return (
              <Card
                key={cat.id}
                className="group relative flex flex-col justify-between overflow-hidden border border-slate-200 bg-white transition-all hover:border-blue-300 hover:shadow-md"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-[11px] font-semibold">
                      {cat.badge}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={cat.href}
                      className="inline-flex items-center text-xs font-semibold text-slate-900 hover:text-blue-600 gap-1 transition-colors"
                    >
                      Explore options <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
