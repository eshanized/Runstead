'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDemo } from '@/lib/demo/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Globe,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceSecurityPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);

  const [scanning, setScanning] = useState(false);
  const [wafEnabled, setWafEnabled] = useState(true);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [blockedIps, setBlockedIps] = useState<string[]>(['192.0.2.45', '198.51.100.99']);
  const [newIpToBlock, setNewIpToBlock] = useState('');

  if (!service) {
    return <div className="p-8 text-center text-slate-500">Service not found.</div>;
  }

  async function handleRunScan() {
    setScanning(true);
    toast.info('Starting vulnerability & malicious file scan on vhost...');

    try {
      setScanning(false);
      toast.success('Security scan finished: 0 malware signatures found across active vhost files.');
    } catch {
      setScanning(false);
    }
  }

  function handleBlockIp() {
    if (!newIpToBlock.trim()) return;
    setBlockedIps((prev) => [...prev, newIpToBlock.trim()]);
    toast.success(`IP ${newIpToBlock.trim()} added to edge firewall blocklist.`);
    setNewIpToBlock('');
  }

  function handleUnblockIp(ip: string) {
    setBlockedIps((prev) => prev.filter((i) => i !== ip));
    toast.success(`IP ${ip} removed from blocklist.`);
  }

  return (
    <div className="space-y-8">
      {/* Overview & Security Health Card */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Website Security & Threat Shield
                </CardTitle>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                  Protection Level: Strict
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Automated malware detection, Web Application Firewall (WAF), and DDoS rate limiting for{' '}
                <strong className="text-slate-800">{service.domain}</strong>.
              </CardDescription>
            </div>

            <Button
              size="sm"
              disabled={scanning}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              onClick={handleRunScan}
            >
              <RotateCcw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning Filesystem...' : 'Run Security Scan'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 font-mono">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                Security Rating
              </span>
              <span className="text-emerald-700 font-bold text-lg mt-0.5 block font-sans">
                98 / 100 (Optimal)
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                WAF Inspection
              </span>
              <span className="text-slate-900 font-bold text-xs mt-1 block">Active (OWASP Top 10)</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                Threats Blocked (24h)
              </span>
              <span className="text-slate-900 font-bold text-xs mt-1 block">18 Bad Bot Probes</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                File Integrity
              </span>
              <span className="text-emerald-700 font-bold text-xs mt-1 flex items-center gap-1 font-sans">
                <CheckCircle2 className="h-3.5 w-3.5" /> 100% Clean
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-600" />
              Automated Defense Modules
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Configure real-time edge filtering rules.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Web Application Firewall (WAF)</div>
                <div className="text-[11px] text-slate-500">
                  Inspects HTTP requests for SQL Injection, XSS, and command injection attempts.
                </div>
              </div>
              <Switch checked={wafEnabled} onCheckedChange={setWafEnabled} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Brute-Force & Rate Limiting</div>
                <div className="text-[11px] text-slate-500">
                  Drops connection attempts from clients exceeding 120 requests/minute to login endpoints.
                </div>
              </div>
              <Switch checked={rateLimitEnabled} onCheckedChange={setRateLimitEnabled} />
            </div>
          </CardContent>
        </Card>

        {/* IP Blocklist */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="h-4 w-4 text-rose-600" />
              Edge IP Address Blocklist
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Blacklisted IP addresses dropped at TCP layer.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. 198.51.100.25"
                value={newIpToBlock}
                onChange={(e) => setNewIpToBlock(e.target.value)}
                className="text-xs font-mono h-8"
              />
              <Button size="sm" onClick={handleBlockIp} className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white">
                <Plus className="h-3.5 w-3.5 mr-1" /> Block IP
              </Button>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              {blockedIps.map((ip) => (
                <div
                  key={ip}
                  className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-200/60"
                >
                  <span className="font-bold text-slate-900">{ip}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600"
                    onClick={() => handleUnblockIp(ip)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
