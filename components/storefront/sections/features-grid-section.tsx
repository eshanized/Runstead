'use client';

import { Zap, ShieldCheck, Server, Globe, RotateCcw, Headphones, Lock, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface FeaturesGridSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function FeaturesGridSection({ section, config }: FeaturesGridSectionProps) {
  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';

  const headline = settings.headline || 'Engineered for reliability and speed';
  const subtitle =
    settings.subtitle ||
    'Clear, verifiable hosting infrastructure specifications without unsupported marketing claims';

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Zap,
    Shield: ShieldCheck,
    Server,
    Globe,
    RotateCcw,
    Headphones,
    Lock,
    Activity,
  };

  const features = settings.features || [
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
  ];

  return (
    <section id="features" className="bg-white py-16 sm:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50">
            Infrastructure Specifications
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{headline}</h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat: any, idx: number) => {
            const Icon = iconMap[feat.icon] || Zap;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 transition-all hover:bg-white hover:shadow-md hover:border-blue-200"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs mb-4"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-1.5">{feat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
