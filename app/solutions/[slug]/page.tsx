import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { solutions } from '@/lib/config/solutions';

export function generateStaticParams() {
  return solutions.map((s) => ({ slug: s.slug }));
}

export default async function SolutionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = solutions.find((s) => s.slug === slug);
  if (!solution) notFound();

  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link href="/solutions" className="text-sm text-muted-foreground hover:text-foreground">&larr; All solutions</Link>
          <div className="mt-6 max-w-3xl">
            <SectionHeading align="left" eyebrow={solution.tagline} title={solution.title} description={solution.description} />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold mb-8">Key benefits</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {solution.benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 rounded-lg border p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <span className="text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold mb-8">Features built for {solution.title.toLowerCase()}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {solution.features.map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-balance">Ready to deploy?</h2>
          <p className="mt-4 text-muted-foreground">Access the platform console and see how the platform works for your use case.</p>
          <div className="mt-8 flex gap-3 justify-center">
            <Button asChild size="lg"><Link href="/dashboard/overview">Open Platform Console <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/pricing">View Pricing</Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
