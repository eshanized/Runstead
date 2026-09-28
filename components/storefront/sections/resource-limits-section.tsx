'use client';

import { Cpu, Database, Gauge, HardDrive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface ResourceLimitsSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function ResourceLimitsSection({ section, config }: ResourceLimitsSectionProps) {
  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';

  const headline = settings.headline || 'Transparent resource allocations';
  const subtitle = settings.subtitle || 'We publish our exact allocation limits so your applications never hit mysterious throttles';

  const limits = [
    {
      icon: Cpu,
      title: 'vCPU Burst & Cores',
      desc: 'Each shared container is granted 100% of 1 core burst; VPS packages receive dedicated virtual cores.',
    },
    {
      icon: Database,
      title: 'Physical Memory (RAM)',
      desc: 'Clear limits from 1 GB up to 8 GB. Applications have dedicated swap space to gracefully handle spikes.',
    },
    {
      icon: Gauge,
      title: 'Disk I/O & IOPS',
      desc: 'NVMe storage clusters provide up to 5,000 IOPS and 150 MB/s sequential throughput per container.',
    },
    {
      icon: HardDrive,
      title: 'Inode Allocations',
      desc: 'Generous inode limits up to 500,000 files ensure large WordPress installations operate without file limits.',
    },
  ];

  return (
    <section className="bg-slate-50 py-16 sm:py-20 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white">
            Resource Allocation Transparency
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{headline}</h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {limits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-xs">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
