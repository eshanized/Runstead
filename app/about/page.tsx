import Link from 'next/link';
import { ArrowRight, Target, Compass, Wrench, Telescope } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { siteConfig } from '@/lib/config/site';

export default function AboutPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="About"
            title="Building the operating system for hosting businesses"
            description={`${siteConfig.company} is building ${siteConfig.name}, a modern platform that aims to replace fragmented hosting-business tooling with a single, unified system.`}
          />
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Target, title: 'Our mission', desc: 'Eliminate the operational complexity of running a hosting business by providing one platform instead of many disconnected tools.' },
              { icon: Compass, title: 'Product philosophy', desc: 'Start with the software platform. Prove the business model. Then progressively expand into owned infrastructure.' },
              { icon: Wrench, title: 'Engineering direction', desc: 'TypeScript throughout. Modular architecture. Server-rendered marketing with client-side interactivity where it matters.' },
              { icon: Telescope, title: 'Long-term ambition', desc: 'Become a complete hosting ecosystem: business software, infrastructure, domains, DNS, and developer APIs under one roof.' },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading align="left" eyebrow="Our approach" title="Software first, infrastructure later" description="We do not need to own servers to solve the operational problems hosting businesses face. We start with the software that makes running a hosting business easier, and expand to infrastructure when it makes commercial sense." />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { phase: 'Phase 1', title: 'Business SaaS', desc: 'Replace WHMCS and fragmented tools with a unified business-management platform. Connect to existing hosting providers through APIs.' },
              { phase: 'Phase 2', title: 'Automation', desc: 'Deepen provisioning automation, domain management, and DNS capabilities. Connect more hosting and registrar providers.' },
              { phase: 'Phase 3', title: 'Infrastructure', desc: 'Progressively build owned hosting infrastructure — shared hosting nodes, VPS, storage, and authoritative DNS servers.' },
            ].map((item) => (
              <Card key={item.phase}>
                <CardContent className="pt-6">
                  <span className="text-xs font-medium text-accent">{item.phase}</span>
                  <h3 className="mt-1 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          <Alert className="border-emerald-200 bg-emerald-50/50">
            <AlertTitle className="text-emerald-900 font-semibold">About Runstead</AlertTitle>
            <AlertDescription className="text-emerald-800 text-xs mt-1">
              Runstead is a modern hosting business operating platform engineered by {siteConfig.company}. Built as a cloud-native, fail-closed multi-tenant system with Row-Level Security, it delivers automated provisioning, domain orchestration, and comprehensive business management. Contact us at {siteConfig.contactEmail}.
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button asChild size="lg"><Link href="/contact">Contact the team <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
