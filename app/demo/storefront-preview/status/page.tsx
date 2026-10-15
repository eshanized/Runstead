'use client';

import { Activity, CheckCircle2, AlertCircle, Clock, Server, Globe } from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const CLUSTERS = [
  { name: 'US-East (Virginia) Compute Pod', region: 'us-east-1', status: 'Operational', latency: '24ms' },
  { name: 'US-West (Oregon) Compute Pod', region: 'us-west-2', status: 'Operational', latency: '38ms' },
  { name: 'EU-Central (Frankfurt) Compute Pod', region: 'eu-central-1', status: 'Operational', latency: '42ms' },
  { name: 'Anycast DNS Global Edge Nodes', region: 'Global (32 PoPs)', status: 'Operational', latency: '8ms' },
  { name: 'Automated SSL Provisioning Engine', region: 'Automated ACME', status: 'Operational', latency: '110ms' },
  { name: 'Customer Portal API Gateway', region: 'Global Edge', status: 'Operational', latency: '19ms' },
];

export default function SystemStatusPage() {
  const { state } = useDemo();
  const config = state.publishedStorefront || state.storefront;

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="text-center space-y-3">
            <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50">
              Operational Status • Infrastructure Telemetry
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Platform System Status
            </h1>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Simulated real-time operational status for host nodes, container clusters, and global DNS networks.
            </p>
          </div>

          {/* Simulation Notice Banner */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Simulated Demonstration Notice:</span>
              <p className="text-[11px] leading-relaxed">
                The metrics and operational states shown below are illustrative demo telemetry generated to showcase Runstead white-label status capabilities. They do not represent live production data center uptime.
              </p>
            </div>
          </div>

          {/* Overall Health Card */}
          <Card className="border-emerald-200 bg-emerald-50/50 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <div>
                <h3 className="font-bold text-base text-emerald-950">All Systems Operational</h3>
                <p className="text-xs text-emerald-800">No active incidents or degraded performance across regional clusters.</p>
              </div>
            </div>
            <div className="hidden sm:block text-right text-xs text-emerald-800">
              <div className="font-bold">Simulated Uptime</div>
              <div>99.98% last 90 days</div>
            </div>
          </Card>

          {/* Cluster Status Rows */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
            {CLUSTERS.map((cluster) => (
              <div key={cluster.name} className="p-4 sm:px-6 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">{cluster.name}</div>
                  <div className="text-[11px] text-slate-400">{cluster.region}</div>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-slate-500 hidden sm:inline text-[11px]">Avg: {cluster.latency}</span>
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {cluster.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Maintenance Log */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              Past Maintenance Events (Simulated)
            </h3>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between font-semibold text-slate-900">
                <span>Kernel Patching — Node Fleet A</span>
                <span className="text-slate-400 text-[11px]">Completed Oct 10, 2026</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Scheduled security microcode updates applied across KVM hypervisors with zero container interruptions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
