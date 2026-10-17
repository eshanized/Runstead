'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDemo } from '@/lib/demo/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Server,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function ServiceMonitoringPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);

  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('1h');

  if (!service) {
    return <div className="p-8 text-center text-slate-500">Service not found.</div>;
  }

  // Generate mock telemetry series based on timeRange
  const samplePoints = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : 14;
  const cpuSeries = [24, 28, 35, 42, 68, 55, 30, 26, 32, 29, 31, 27, 45, 38, 29, 32, 40, 35, 28, 25, 30, 33, 29, 27].slice(0, samplePoints);
  const ramSeries = [52, 53, 54, 55, 60, 58, 56, 55, 56, 57, 56, 55, 58, 59, 56, 55, 57, 58, 56, 55, 56, 57, 56, 55].slice(0, samplePoints);

  const isStorageHigh = service.resourceUsage?.some(
    (r) => (r.type === 'storage' || r.label.toLowerCase().includes('storage') || r.label.toLowerCase().includes('disk')) && r.used / r.total >= 0.85
  );

  return (
    <div className="space-y-8">
      {/* Overview & Time Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Real-Time Performance & Metrics</h2>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
              Sampling Rate: 10s
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Telemetry collected via node hypervisor daemon for <strong className="text-slate-800">{service.domain}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(['1h', '24h', '7d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                timeRange === range
                  ? 'bg-white text-slate-950 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Storage High Warning */}
      {isStorageHigh && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">Storage Capacity Threshold Warning (&gt;85%)</p>
            <p className="leading-relaxed">
              Filesystem disk usage is approaching account limits. Consider cleaning up old backups or upgrading storage limits in Service Settings.
            </p>
          </div>
        </div>
      )}

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(service.resourceUsage || []).map((res, idx) => {
          const percent = Math.min(100, Math.round((res.used / res.total) * 100));
          const isWarn = percent >= 85;

          return (
            <Card key={idx} className="border border-slate-200 bg-white shadow-xs">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{res.label}</span>
                  {res.type === 'cpu' || res.label.toLowerCase().includes('cpu') ? (
                    <Cpu className="h-4 w-4 text-blue-500" />
                  ) : res.type === 'memory' || res.label.toLowerCase().includes('memory') || res.label.toLowerCase().includes('ram') ? (
                    <Activity className="h-4 w-4 text-purple-500" />
                  ) : res.type === 'storage' || res.label.toLowerCase().includes('storage') || res.label.toLowerCase().includes('disk') ? (
                    <HardDrive className={`h-4 w-4 ${isWarn ? 'text-amber-500' : 'text-indigo-500'}`} />
                  ) : (
                    <Wifi className="h-4 w-4 text-emerald-500" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-2xl font-extrabold text-slate-950 tracking-tight">
                    {percent}%
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {res.used} / {res.total} {res.unit}
                  </div>
                </div>

                <Progress
                  value={percent}
                  className={`h-2 ${isWarn ? '[&>div]:bg-amber-500' : '[&>div]:bg-blue-600'}`}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Synthetic Chart Visualizers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU Telemetry Chart */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-600" />
                vCPU Load Average (%)
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                Avg: 32.4%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="h-36 flex items-end gap-1.5 sm:gap-2 px-2 border-b border-l border-slate-200 pb-1">
              {cpuSeries.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-blue-500/80 hover:bg-blue-600 rounded-t-sm transition-all cursor-pointer"
                    style={{ height: `${val}%` }}
                  />
                  <div className="hidden group-hover:block absolute -top-7 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded font-mono z-10">
                    {val}%
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono px-2">
              <span>{timeRange === '1h' ? '60 mins ago' : timeRange === '24h' ? '24 hours ago' : '7 days ago'}</span>
              <span>Now</span>
            </div>
          </CardContent>
        </Card>

        {/* RAM Telemetry Chart */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                Memory Consumption (RAM)
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                Avg: 56.1%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="h-36 flex items-end gap-1.5 sm:gap-2 px-2 border-b border-l border-slate-200 pb-1">
              {ramSeries.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-purple-500/80 hover:bg-purple-600 rounded-t-sm transition-all cursor-pointer"
                    style={{ height: `${val}%` }}
                  />
                  <div className="hidden group-hover:block absolute -top-7 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded font-mono z-10">
                    {val}%
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono px-2">
              <span>{timeRange === '1h' ? '60 mins ago' : timeRange === '24h' ? '24 hours ago' : '7 days ago'}</span>
              <span>Now</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Latency & HTTP Edge Stats */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wifi className="h-4 w-4 text-emerald-600" />
            Global Edge Gateway & HTTP Request Ingestion
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Incoming HTTP/HTTPS request distribution and edge cache hit ratios.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 font-sans">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Requests (24h)</div>
              <div className="text-lg font-extrabold text-slate-950 mt-1">142,850</div>
              <div className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +12.4% vs yesterday
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Edge Latency</div>
              <div className="text-lg font-extrabold text-slate-950 mt-1">18.4 ms</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Global Anycast POPs</div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Edge Cache Hit Ratio</div>
              <div className="text-lg font-extrabold text-emerald-600 mt-1">94.8%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Static assets cached</div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HTTP 2xx Success Rate</div>
              <div className="text-lg font-extrabold text-slate-950 mt-1">99.96%</div>
              <div className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Nominal
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
