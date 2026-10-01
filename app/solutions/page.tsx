import Link from 'next/link';
import { Code, Building2, Rocket, Server, Cloud, ArrowRight, CheckCircle2 } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { solutions } from '@/lib/config/solutions';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code, Building2, Rocket, Server, Cloud,
};

export default function SolutionsPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Solutions"
            title="Solutions for every type of hosting business"
            description="Whether you are a freelancer hosting a handful of client sites or an established hosting company replacing legacy billing software, the platform adapts to your scale."
          />
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {solutions.map((solution, i) => {
            const Icon = iconMap[solution.icon] ?? Code;
            const reversed = i % 2 === 1;
            return (
              <div key={solution.slug} className={`grid items-center gap-8 lg:grid-cols-2 ${reversed ? 'lg:grid-flow-col-dense' : ''}`}>
                <div className={reversed ? 'lg:col-start-2' : ''}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-2xl font-bold">{solution.title}</h2>
                  <p className="mt-1 text-accent font-medium text-sm">{solution.tagline}</p>
                  <p className="mt-4 text-muted-foreground">{solution.description}</p>
                  <ul className="mt-6 space-y-2">
                    {solution.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="mt-6">
                    <Link href={`/solutions/${solution.slug}`}>
                      Learn more <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <Card className={reversed ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-4">Key features</h3>
                    <div className="space-y-4">
                      {solution.features.map((f) => (
                        <div key={f.title}>
                          <h4 className="font-medium text-sm">{f.title}</h4>
                          <p className="text-sm text-muted-foreground mt-0.5">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-balance">Find the right plan for your business</h2>
          <p className="mt-4 text-muted-foreground">From a free sandbox to enterprise infrastructure, there is a plan for every stage.</p>
          <div className="mt-8 flex gap-3 justify-center">
            <Button asChild size="lg"><Link href="/pricing">View Pricing</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/demo">Try the Demo</Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
