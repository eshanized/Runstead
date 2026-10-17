'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDemo } from '@/lib/demo/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Search,
  Download,
  RotateCcw,
  AlertTriangle,
  Info,
  CheckCircle2,
  Terminal,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceLogsPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);

  if (!service) {
    return <div className="p-8 text-center text-slate-500">Service not found.</div>;
  }

  const logs = service.logs || [];

  const filteredLogs = logs.filter((log) => {
    if (severityFilter !== 'ALL' && log.severity !== severityFilter) return false;
    if (categoryFilter !== 'ALL' && log.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return log.message.toLowerCase().includes(q) || log.category.toLowerCase().includes(q);
    }
    return true;
  });

  function handleExportLogs() {
    const raw = filteredLogs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.severity.toUpperCase()}] [${l.category.toUpperCase()}] ${l.message}`
      )
      .join('\n');

    const blob = new Blob([raw], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${service!.domain}-access-error.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredLogs.length} log entries to file.`);
  }

  return (
    <div className="space-y-6">
      {/* Overview & Live Status Card */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-indigo-600" />
                  Service Telemetry & Operational Logs
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono ${
                    isLiveStreaming
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isLiveStreaming ? '● Live Tail' : 'Paused'}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Real-time operational events, web server hits, SSL automation, and database audits for{' '}
                <strong className="text-slate-800">{service.domain}</strong>.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1.5"
                onClick={() => setIsLiveStreaming((prev) => !prev)}
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isLiveStreaming ? 'animate-spin text-emerald-600' : ''}`} />
                {isLiveStreaming ? 'Pause Tail' : 'Resume Tail'}
              </Button>

              <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1.5"
                onClick={handleExportLogs}
              >
                <Download className="h-3.5 w-3.5" />
                Export Log File
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Severity:
              </span>
              {['ALL', 'info', 'warning', 'error'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono transition-colors ${
                    severityFilter === s
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}

              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-2">
                Category:
              </span>
              {['ALL', 'web', 'system', 'database', 'auth', 'mail'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors ${
                    categoryFilter === c
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search log messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-white font-mono"
              />
            </div>
          </div>

          {/* Log Stream Output */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-x-auto max-h-[600px] shadow-inner space-y-1.5">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-sans">
                No telemetry logs matching the selected filters.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const sevColor =
                  log.severity === 'error'
                    ? 'text-rose-400 font-bold'
                    : log.severity === 'warning'
                      ? 'text-amber-400 font-bold'
                      : 'text-cyan-400';

                const catBadge =
                  log.category === 'database'
                    ? 'text-indigo-400 bg-indigo-950/60'
                    : log.category === 'auth'
                      ? 'text-purple-400 bg-purple-950/60'
                      : log.category === 'mail'
                        ? 'text-blue-400 bg-blue-950/60'
                        : log.category === 'web'
                          ? 'text-emerald-400 bg-emerald-950/60'
                          : 'text-slate-400 bg-slate-900';

                return (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-start gap-2 py-1 border-b border-slate-900/80 hover:bg-slate-900/50 transition-colors"
                  >
                    <span className="text-slate-500 text-[11px] shrink-0">
                      {log.timestamp ? new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19) : ''}
                    </span>

                    <span className={`text-[10px] uppercase shrink-0 w-16 text-center ${sevColor}`}>
                      [{log.severity}]
                    </span>

                    <span className={`text-[10px] uppercase px-1.5 rounded shrink-0 ${catBadge}`}>
                      {log.category}
                    </span>

                    <span className="text-slate-200 flex-1 leading-relaxed break-all">
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
