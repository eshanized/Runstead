import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle, Clock } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { roadmapStages } from '@/lib/config/features';

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  live: CheckCircle2,
  available: CheckCircle2,
  demo: CheckCircle2,
  planned: Clock,
  roadmap: Circle,
};

export default function RoadmapPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Roadmap"
            title="From SaaS foundation to hosting ecosystem"
            description="Six stages of evolution: from a business-management platform to a complete hosting infrastructure ecosystem with owned servers, DNS, and developer APIs."
          />
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="gap-2 bg-primary">
              <Link href="/progress">
                <span>View Live Development Progress & Delivery Forecast</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {roadmapStages.map((stage, i) => (
              <div key={stage.stage} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                    {i + 1}
                  </div>
                  {i < roadmapStages.length - 1 && <div className="h-full w-px flex-1 bg-border mt-2 min-h-[40px]" />}
                </div>
                <Card className="mb-6 flex-1">
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-accent">{stage.stage}</span>
                    </div>
                    <h3 className="mt-1 text-lg font-semibold">{stage.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{stage.description}</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {stage.items.map((item) => {
                        const Icon = statusIcon[item.status] ?? Circle;
                        return (
                          <div key={item.name} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                            <Icon className={`h-4 w-4 ${item.status === 'live' || item.status === 'available' ? 'text-success' : item.status === 'planned' ? 'text-accent' : 'text-muted-foreground'}`} />
                            <span>{item.name}</span>
                            <StatusBadge status={item.status} className="ml-auto" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Status legend" title="How to read this roadmap" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
            {[
              { status: 'live', label: 'Live & Operational', desc: 'Active in production infrastructure today.' },
              { status: 'planned', label: 'Planned for next release', desc: 'Targeted for the immediate deployment cycle.' },
              { status: 'roadmap', label: 'Long-term roadmap', desc: 'Scheduled for future infrastructure expansion.' },
            ].map((item) => (
              <Card key={item.status}>
                <CardContent className="pt-6">
                  <StatusBadge status={item.status} />
                  <h3 className="mt-3 font-semibold text-sm">{item.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-balance">Deploy with Runstead today</h2>
          <p className="mt-4 text-muted-foreground">Access the platform console to experience the hosting operating system.</p>
          <div className="mt-8">
            <Button asChild size="lg"><Link href="/dashboard/overview">Open Platform Console <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
