'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDemo } from '@/lib/demo/store';
import {
  renewServiceSslCertificate,
  toggleServiceHttpsRedirect,
} from '@/lib/demo/workflows';
import { createDefaultSsl } from '@/lib/demo/service-factories';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  RotateCcw,
  Globe,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Server,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceSslPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state, setState } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);

  const ssl = service?.sslCertificate || (service ? createDefaultSsl(service.domain || 'example.com') : null);

  const [renewing, setRenewing] = useState(false);
  const [acmeStep, setAcmeStep] = useState<string | null>(null);

  if (!service || !ssl) {
    return <div className="p-8 text-center text-slate-500">Service not found.</div>;
  }

  const isExpired = ssl.status === 'expired' || new Date(ssl.expiryDate) < new Date();
  const daysRemaining = Math.max(
    0,
    Math.round((new Date(ssl.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  async function handleRenew() {
    setRenewing(true);
    setAcmeStep('Authorizing domain ownership & requesting leaf certificate from Let\'s Encrypt...');

    try {
      const nextState = renewServiceSslCertificate(state, service!.id);
      setState(nextState);
      toast.success(`SSL certificate renewed successfully for ${service!.domain}!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Renewal failed');
    } finally {
      setRenewing(false);
      setAcmeStep(null);
    }
  }

  function handleToggleHttps(enabled: boolean) {
    try {
      const nextState = toggleServiceHttpsRedirect(state, service!.id, enabled);
      setState(nextState);
      toast.success(`Force HTTPS redirect ${enabled ? 'enabled' : 'disabled'}.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error toggling HTTPS redirect');
    }
  }

  return (
    <div className="space-y-8">
      {/* Expiry Warning Callout if Expired */}
      {isExpired && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-950">SSL Certificate Expired</p>
            <p className="leading-relaxed">
              Visitors to <strong className="font-mono">{service.domain}</strong> currently encounter browser security warnings.
              Click &quot;Reissue Certificate&quot; below to complete an automated ACME challenge and restore TLS encryption.
            </p>
          </div>
        </div>
      )}

      {/* Main Certificate Card */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-emerald-600" />
                  SSL / TLS Certificate Management
                </CardTitle>
                <Badge
                  variant={isExpired ? 'destructive' : 'default'}
                  className={!isExpired ? 'bg-emerald-600' : ''}
                >
                  {isExpired ? 'Expired' : 'Active & Valid'}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Automated Let&apos;s Encrypt TLS issuance, cipher configuration, and HTTPS redirection.
              </CardDescription>
            </div>

            <Button
              size="sm"
              disabled={renewing}
              className={`text-xs gap-1.5 ${
                isExpired ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
              onClick={handleRenew}
            >
              <RotateCcw className={`h-3.5 w-3.5 ${renewing ? 'animate-spin' : ''}`} />
              {renewing ? 'Reissuing Certificate...' : 'Reissue / Renew Certificate'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 text-xs">
          {/* ACME Progress Indicator */}
          {acmeStep && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-2 animate-pulse">
              <div className="flex items-center gap-2 font-bold text-blue-900 text-xs">
                <Zap className="h-4 w-4 text-blue-600 animate-bounce" />
                ACME Challenge Execution In Progress
              </div>
              <p className="font-mono text-[11px] text-blue-800">{acmeStep}</p>
            </div>
          )}

          {/* Certificate Spec Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 font-mono">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Certificate Issuer</span>
              <span className="font-bold text-slate-900 text-xs mt-1 block">{ssl.issuer}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Validity Window</span>
              <span className="text-slate-700 text-xs mt-1 block">
                {isExpired ? '0 days remaining' : `${daysRemaining} days left`}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Issue Date</span>
              <span className="text-slate-700 text-xs mt-1 block">
                {ssl.issueDate ? new Date(ssl.issueDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expiration Date</span>
              <span className={`text-xs mt-1 block font-bold ${isExpired ? 'text-rose-600' : 'text-slate-700'}`}>
                {ssl.expiryDate ? new Date(ssl.expiryDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Covered SANs */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900">Covered Domains (Subject Alternative Names)</h4>
            <div className="flex flex-wrap gap-2">
              {ssl.coveredDomains.map((dom) => (
                <Badge key={dom} variant="outline" className="font-mono text-xs bg-white text-slate-800 border-slate-300">
                  <Globe className="h-3 w-3 mr-1 text-slate-400" />
                  {dom}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Policies & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              HTTPS & Transport Security Policies
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enforce encryption headers and TLS protocols.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Force Automatic HTTPS Redirect</div>
                <div className="text-[11px] text-slate-500">
                  Redirects unencrypted HTTP port 80 traffic to HTTPS port 443 via HTTP 301.
                </div>
              </div>
              <Switch
                checked={ssl.forceHttps}
                onCheckedChange={(checked) => handleToggleHttps(checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">HSTS (Strict-Transport-Security)</div>
                <div className="text-[11px] text-slate-500">
                  Instructs browsers to always connect via HTTPS for 12 months with preload headers.
                </div>
              </div>
              <Switch
                checked={ssl.hsts}
                onCheckedChange={(checked) => {
                  toast.success(`HSTS policy ${checked ? 'enabled' : 'disabled'}.`);
                }}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Minimum TLS Protocol Version</div>
                <div className="text-[11px] text-slate-500">
                  Drop legacy TLS 1.0/1.1 connections; require modern cryptographic ciphers.
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs bg-white text-slate-800">
                {ssl.minTlsVersion || 'TLS 1.3'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security Diagnostics & Cipher Suite */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-600" />
              Cryptographic Parameters & Audit Score
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Automated TLS certificate chain inspection.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs font-mono">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-sans font-semibold text-slate-700">SSL Labs Benchmark Score</span>
              <Badge className="bg-emerald-600 text-white font-bold text-xs px-2.5">A+ Rated</Badge>
            </div>

            <div className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                Active Cipher Suite
              </div>
              <div className="text-slate-800 text-[11px] truncate">TLS_AES_256_GCM_SHA384 (ECDHE-P256)</div>
            </div>

            <div className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                Trust Chain Hierarchy
              </div>
              <div className="text-slate-700 text-[11px]">
                {service.domain} &rarr; R3 (Let&apos;s Encrypt Intermediate) &rarr; ISRG Root X1
              </div>
            </div>

            <div className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                Last Automation Audit Log
              </div>
              <div className="text-slate-600 text-[11px] font-sans">
                {ssl.lastOperationLog || 'Certificate healthy; next automatic renewal scheduled 30 days before expiration.'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
