'use client';

import Link from 'next/link';
import {
  Headphones,
  BookOpen,
  Activity,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  LifeBuoy,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SupportHubPage() {
  const { state } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
              Technical Helpdesk
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Customer Support Center
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              We provide direct technical assistance for DNS records, SSL certificates, container resources, and billing inquiries.
            </p>
          </div>

          {/* 3 Support Channels */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Headphones className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Client Support Tickets</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Open a tracked ticket through the customer portal. Our staff responds directly to technical requests with conversation logs.
                </p>
              </div>

              <Button asChild size="sm" className="w-full text-white text-xs font-semibold" style={{ backgroundColor: primaryColor }}>
                <Link href="/client/login">
                  Open Portal Ticket <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </Card>

            <Card className="border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Knowledge Base</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Browse self-service technical tutorials covering DNS propagation, cPanel configurations, SSH setup, and SSL installation.
                </p>
              </div>

              <Button asChild variant="outline" size="sm" className="w-full text-xs bg-white">
                <Link href="/storefront/knowledge-base">
                  Search Documentation <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </Card>

            <Card className="border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">System Telemetry</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Check live status indicators for compute clusters, database storage pools, Anycast DNS routing, and edge connectivity.
                </p>
              </div>

              <Button asChild variant="outline" size="sm" className="w-full text-xs bg-white">
                <Link href="/storefront/status">
                  View Status Board <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </Card>
          </div>

          {/* Common FAQs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Quick Solutions to Common Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
              <div className="space-y-1">
                <div className="font-bold text-slate-900">How long does DNS propagation take?</div>
                <div>Anycast DNS changes usually propagate globally within 5 to 15 minutes.</div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900">Where can I download invoice receipts?</div>
                <div>All paid and pending invoices can be viewed and printed directly in the customer portal.</div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900">How do I restore a backup?</div>
                <div>Snapshot restore points are accessible on your service detail view in customer portal.</div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900">Can I reset my server root password?</div>
                <div>Yes. You can trigger automated root password resets or SSH key redeployments from the portal.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
