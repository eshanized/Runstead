import Link from 'next/link';
import { Shield, Lock, Key, Eye, ClipboardList, RefreshCw, AlertTriangle, Activity, Server, ArrowRight } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const securityAreas = [
  { icon: Shield, title: 'Tenant Isolation', desc: 'Each hosting business operates in an isolated tenant with its own data boundary. Customer data is never shared between tenants.' },
  { icon: Lock, title: 'Role-Based Access Control', desc: 'Granular permissions for team members: admin, billing manager, support agent, and read-only roles with per-module access control.' },
  { icon: Key, title: 'Secrets Management', desc: 'Provider API keys, payment credentials, and SMTP passwords are stored encrypted and never exposed to client-side code.' },
  { icon: ClipboardList, title: 'Audit Logging', desc: 'Every significant action — customer changes, billing operations, provisioning events, team access — is logged with timestamp and actor.' },
  { icon: Server, title: 'Secure Provisioning', desc: 'Provisioning jobs execute through server-side connectors with credential isolation. No infrastructure credentials reach the browser.' },
  { icon: RefreshCw, title: 'Payment Webhook Verification', desc: 'Payment gateway webhooks are verified through signature validation before processing. Replay attacks are prevented with timestamp checks.' },
  { icon: RefreshCw, title: 'Backup & Recovery', desc: 'Platform data is backed up with configurable retention. Point-in-time recovery for accidental data loss scenarios.' },
  { icon: AlertTriangle, title: 'Abuse Prevention', desc: 'Rate limiting, input validation, and abuse detection patterns to prevent automated attacks and resource exhaustion.' },
  { icon: Activity, title: 'Operational Monitoring', desc: 'Infrastructure health, service uptime, error rates, and security events monitored with alerting for anomalies.' },
];

export default function SecurityPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Security"
            title="Security architecture and design principles"
            description="The platform is designed with security as a foundational principle: tenant isolation, role-based access, encrypted secrets, audit trails, and secure provisioning workflows."
          />
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {securityAreas.map((s) => (
              <Card key={s.title}>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Principles" title="Security design principles" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              'Deny by default: access is granted explicitly, never implicitly',
              'Server-side validation: all mutations are validated on the server',
              'Minimal credential exposure: secrets never reach the browser',
              'Principle of least privilege: roles grant only necessary access',
              'Defense in depth: multiple layers of access control and validation',
              'Secure by construction: security is built in, not bolted on',
            ].map((principle) => (
              <div key={principle} className="rounded-lg border bg-card p-4 text-sm">{principle}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          <Alert className="border-emerald-200 bg-emerald-50/50">
            <AlertTitle className="text-emerald-900 font-semibold">Active Production Security Controls</AlertTitle>
            <AlertDescription className="text-emerald-800 text-xs mt-1">
              Runstead implements fail-closed PostgreSQL Row-Level Security, AES-256-GCM authenticated encryption for provider secrets, SSRF protection against RFC-1918 and cloud metadata endpoints, sliding-window rate limiters, and constant-time password verification.
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button asChild size="lg"><Link href="/dashboard/overview">Open Platform Console <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
