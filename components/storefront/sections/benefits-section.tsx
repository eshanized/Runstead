'use client';

import { Terminal, Shield, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface BenefitsSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function BenefitsSection({ section, config }: BenefitsSectionProps) {
  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';

  const headline = settings.headline || 'Built for developers and small businesses';
  const subtitle = settings.subtitle || 'Every service comes with automated tooling and straightforward management';

  const benefits = [
    {
      icon: Terminal,
      title: 'Developer Tooling',
      description: 'Support for Git deployment, SSH access, cron jobs, and PHP/Node/Python version selectors.',
    },
    {
      icon: Clock,
      title: 'Instant Automation',
      description: 'Zero manual hold queues. Services and DNS zones are configured automatically immediately after order payment.',
    },
    {
      icon: Shield,
      title: 'Isolated Environments',
      description: 'Dedicated cgroup boundaries ensure predictable memory allocation and prevent noisy neighbor interference.',
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-20 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50">
            Platform Benefits
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{headline}</h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">{b.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{b.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
