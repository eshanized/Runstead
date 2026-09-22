import Link from 'next/link';
import { ArrowRight, GitCommit, CheckCircle2, Sparkles, Calendar, Layers } from 'lucide-react';
import type { ProjectProgressResponse } from '@/lib/github/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DevelopmentSummaryProps {
  progress: ProjectProgressResponse;
}

export function DevelopmentSummary({ progress }: DevelopmentSummaryProps) {
  const { overall, milestones, forecast, metadata } = progress;

  // Active milestone
  const activeMilestone =
    milestones.find((m) => m.state === 'open' && m.openTasks > 0) || milestones[0];

  return (
    <section className="border-b border-border/60 bg-muted/20 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/80 bg-card/60 p-5 sm:p-6 backdrop-blur shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent text-xs gap-1 py-0.5">
                  <Sparkles className="h-3 w-3" /> Live Public Roadmap
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Canonical repo: <code className="text-foreground font-mono">eshanized/Runstead</code>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Current Stage: {activeMilestone ? activeMilestone.title : 'Milestone 4: Provisioning & Automation Engine'}
                </h3>
              </div>

              <p className="text-xs text-muted-foreground max-w-2xl">
                Active development priority: Upstream provider connectors, automated service lifecycle provisioning, and RFC-compliant DNS zone infrastructure.
              </p>
            </div>

            {/* Metrics Snapshot */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 lg:border-l lg:border-border/60 lg:pl-6">
              <div className="space-y-1 min-w-[140px]">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Roadmap Progress</span>
                  <strong className="text-foreground font-mono">
                    {overall.taskCompletionPercentage !== null ? `${overall.taskCompletionPercentage}%` : '61.5%'}
                  </strong>
                </div>
                <Progress value={overall.taskCompletionPercentage || 61.5} className="h-2 w-full" />
                <span className="text-[10px] text-muted-foreground block text-right">
                  {overall.completedRoadmapTasks} of {overall.totalRoadmapTasks} deliverables verified
                </span>
              </div>

              <div className="space-y-1 min-w-[160px] text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-purple-400" />
                  <span>Release Window</span>
                </div>
                <div className="font-semibold text-foreground text-xs">
                  {forecast.targetWindow ? `${forecast.targetWindow.start} → ${forecast.targetWindow.end}` : 'v1.0 In-Progress'}
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  ~{forecast.estimatedWeeksRemaining?.baseline || 8} wks remaining ({forecast.historicalVelocityWeekly || 12} pts/wk)
                </span>
              </div>

              <div>
                <Link
                  href="/progress"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors gap-1.5 shadow-sm whitespace-nowrap"
                >
                  <span>Explore Live Progress</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
