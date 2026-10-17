'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Server, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface HeroSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function HeroSection({ section, config }: HeroSectionProps) {
  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';
  const accentColor = config.accentColor || '#00c896';

  const eyebrow = settings.eyebrow || 'High-Performance Cloud Infrastructure';
  const headline = settings.headline || config.headline || 'Host smarter. Scale faster.';
  const description =
    settings.description ||
    config.description ||
    'Deploy web applications, manage domains, and scale virtual servers with enterprise-grade isolation, automated SSL, and NVMe-backed storage.';
  const primaryCtaText = settings.primaryCtaText || 'Explore Hosting Plans';
  const primaryCtaHref = settings.primaryCtaHref || '/storefront/hosting';
  const secondaryCtaText = settings.secondaryCtaText || 'Search Domains';
  const secondaryCtaHref = settings.secondaryCtaHref || '/storefront/domains';
  const badgeText = settings.badgeText || 'Instant Automated Provisioning';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white py-16 sm:py-24 border-b border-slate-100">
      {/* Background visual accents */}
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-40">
        <div
          className="absolute -top-40 right-1/4 h-96 w-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute top-1/2 -left-20 h-80 w-80 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Hero Content */}
          <div className="text-center lg:text-left lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-xs">
              <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
              <span>{eyebrow}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">{badgeText}</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl leading-[1.1]">
              {headline}
            </h1>

            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed lg:mx-0">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto text-white font-semibold shadow-md hover:opacity-95 transition-all text-sm h-11 px-6"
                style={{ backgroundColor: primaryColor }}
              >
                <Link href={primaryCtaHref}>
                  {primaryCtaText} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-sm h-11 px-6 bg-white hover:bg-slate-50">
                <Link href={secondaryCtaHref}>{secondaryCtaText}</Link>
              </Button>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Free Automated SSL
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" /> NVMe SSD Storage
              </span>
              <span className="flex items-center gap-1.5">
                <Server className="h-4 w-4 text-blue-600" /> Isolated Containers
              </span>
            </div>
          </div>

          {/* Infrastructure Visual Illustration */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-mono font-medium text-slate-500">infrastructure-status.sh</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-emerald-300 text-emerald-700 bg-emerald-50">
                  ALL SYSTEMS NOMINAL
                </Badge>
              </div>

              <div className="space-y-4 py-4 text-xs font-mono">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-1">
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>HOST NODE CLUSTER</span>
                    <span className="text-emerald-600">ACTIVE</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Storage Pool</span>
                    <span>Pure NVMe SSD</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Uplink Speed</span>
                    <span>10 Gbps Redundant</span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-1">
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>PROVISIONING ENGINE</span>
                    <span className="text-blue-600">READY</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Avg Setup Latency</span>
                    <span>&lt; 5 seconds</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>DNS Propagation</span>
                    <span>Anycast Global</span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-1">
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>CONTAINER WORKLOADS</span>
                    <span className="text-purple-600">ISOLATED</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Security Boundaries</span>
                    <span>Dedicated cgroups</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Certificates</span>
                    <span>Automated TLS</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center text-[11px] text-slate-400">
                Transparent hosting metrics backed by modern virtualization.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
