'use client';

import Link from 'next/link';
import { Server, ShieldCheck, Zap, Globe, Users, Award, ArrowRight } from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutUsPage() {
  const { state } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-14">
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white">
              About {config.businessName}
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Reliable hosting engineered for developers and growing businesses
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              We started {config.businessName} with a straightforward commitment: provide predictable, flat-rate cloud hosting with modern isolation, automated backups, and responsive human support.
            </p>
          </div>

          {/* Core Values */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Modern Architecture</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All customer workloads run on enterprise NVMe solid-state storage pools with dedicated memory boundaries and automated SSL provisioning.
              </p>
            </Card>

            <Card className="border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Zero Hidden Throttles</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We believe in full resource transparency. We publish our exact CPU burst limits, RAM caps, and disk IOPS so your applications never face arbitrary degradation.
              </p>
            </Card>

            <Card className="border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Human Technical Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our helpdesk tickets are reviewed directly by hosting specialists who understand DNS zone propagation, SSL handshakes, and database tuning.
              </p>
            </Card>
          </div>

          {/* Infrastructure commitment */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Our Cloud Infrastructure Commitment</h2>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                From personal web projects to high-traffic SaaS applications, our hosting nodes are distributed across redundant Tier-3 data centers equipped with diesel generators, biometric access, and multi-homed BGP uplinks.
              </p>
              <p>
                We do not practice overselling compute resources. Every Virtual Private Server is strictly assigned its dedicated CPU cores and ECC memory.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Multi-region Anycast DNS
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Daily snapshot retention
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> KVM hypervisor isolation
              </span>
            </div>
          </div>

          {/* Illustrative disclaimer */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 space-y-1">
            <div className="font-bold">Investor Demo Disclosure</div>
            <div>
              {config.businessName} is an active white-label storefront operated through the Runstead hosting-commerce SaaS platform.
            </div>
          </div>

          <div className="text-center pt-4">
            <Button asChild className="text-white text-xs font-semibold h-10 px-6 shadow-sm" style={{ backgroundColor: primaryColor }}>
              <Link href="/demo/storefront-preview/hosting">
                Explore Our Hosting Catalog <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
