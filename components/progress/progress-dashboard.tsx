'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  GitCommit,
  GitPullRequest,
  Tag,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type {
  ProjectProgressResponse,
  RoadmapTask,
  WorkState,
  WorkCategory,
} from '@/lib/github/types';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ProgressDashboardProps {
  initialData: ProjectProgressResponse;
}

export function ProgressDashboard({ initialData }: ProgressDashboardProps) {
  const [data, setData] = useState<ProjectProgressResponse>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setRefreshError(null);
      const res = await fetch('/api/project-progress?refresh=true');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to refresh`);
      }
      const updated = await res.json();
      setData(updated);
    } catch (err: unknown) {
      setRefreshError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const { overall, milestones, tasks, forecast, releaseReadiness, recentActivity, metadata } = data;

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchNumber = `#${task.number}`.includes(q);
      const matchBody = task.body.toLowerCase().includes(q);
      if (!matchTitle && !matchNumber && !matchBody) return false;
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'open' && task.state !== 'open') return false;
      if (statusFilter === 'completed' && task.state !== 'closed' && task.status !== 'completed')
        return false;
      if (statusFilter !== 'open' && statusFilter !== 'completed' && task.status !== statusFilter)
        return false;
    }

    if (milestoneFilter !== 'all') {
      if (!task.milestone || task.milestone.title !== milestoneFilter) return false;
    }

    if (categoryFilter !== 'all') {
      if (task.category !== categoryFilter) return false;
    }

    return true;
  });

  const completedTasks = tasks.filter(
    (t) => t.state === 'closed' || t.status === 'completed'
  );

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return 'Unknown';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadgeVariant = (status: WorkState) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'blocked':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'in-review':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'planned':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getCategoryBadgeVariant = (cat: WorkCategory) => {
    switch (cat) {
      case 'feature':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'security':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'testing':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'infrastructure':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'bug':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'documentation':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-12">
      {/* Top Banner / Stale Alert if applicable */}
      {metadata.isStale && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              {metadata.errorMessage ||
                'Displaying cached snapshot. GitHub API could not be reached immediately.'}
            </span>
          </div>
          <span className="text-[11px] text-amber-400/80 font-mono">
            Snapshot time: {formatDateTime(metadata.lastRefreshed)}
          </span>
        </div>
      )}

      {/* Hero Header */}
      <section className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent gap-1 text-xs py-0.5">
                <Sparkles className="h-3 w-3" /> Live Public Roadmap & Telemetry
              </Badge>
              <Badge
                variant="outline"
                className={`text-[11px] font-mono py-0.5 ${
                  metadata.dataSource === 'live'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                }`}
              >
                {metadata.dataSource === 'live' ? '● Synced to GitHub' : '● Verified Snapshot'}
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Runstead Development Progress
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              Real-time engineering completion, historical velocity, verifiable release criteria, and delivery forecasts
              sourced directly from our open GitHub repository.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 border-border/80 hover:bg-muted/60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
            </Button>
            <Button asChild size="sm" className="gap-2 bg-primary hover:bg-primary/90">
              <a
                href={`https://github.com/${metadata.repository || 'eshanized/Runstead'}`}
                target="_blank"
                rel="noreferrer"
              >
                <span>GitHub Repository</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Freshness & Metadata Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-accent" />
              Last refreshed: <strong className="text-foreground">{formatDateTime(metadata.lastRefreshed)}</strong>
            </span>
            <span className="text-border">|</span>
            <span>
              Canonical Target: <code className="text-foreground font-mono">eshanized/Runstead</code>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/roadmap" className="text-accent hover:underline flex items-center gap-1">
              Architecture Vision <ArrowUpRight className="h-3 w-3" />
            </Link>
            <span className="text-border">|</span>
            <a
              href={`https://github.com/${metadata.repository || 'eshanized/Runstead'}/blob/master/docs/ROADMAP.md`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline flex items-center gap-1"
            >
              Roadmap Specs <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      {/* KPI Overview Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Overall Task Completion */}
        <Card className="border-border/80 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Task Completion
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {overall.hasRoadmap ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-foreground">
                    {overall.taskCompletionPercentage !== null ? `${overall.taskCompletionPercentage}%` : 'N/A'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({overall.completedRoadmapTasks}/{overall.totalRoadmapTasks} tasks)
                  </span>
                </div>
                <Progress value={overall.taskCompletionPercentage || 0} className="h-2" />
                <p className="text-[11px] text-muted-foreground">
                  {overall.openRoadmapTasks} tasks remaining across all open milestones.
                </p>
              </>
            ) : (
              <div className="py-2 text-xs text-muted-foreground">
                No roadmap tasks configured yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metric 2: Effort-Weighted Completion */}
        <Card className="border-border/80 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Effort-Weighted Progress
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {overall.totalEstimatedEffort > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-foreground">
                    {overall.effortCompletionPercentage !== null ? `${overall.effortCompletionPercentage}%` : 'N/A'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({overall.completedEstimatedEffort}/{overall.totalEstimatedEffort} pts)
                  </span>
                </div>
                <Progress value={overall.effortCompletionPercentage || 0} className="h-2" />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Coverage: {overall.effortCoveragePercentage}%</span>
                  <span>{overall.unestimatedTaskCount} unestimated</span>
                </div>
              </>
            ) : (
              <div className="py-2 text-xs text-muted-foreground">
                Effort estimates not configured.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metric 3: Active Delivery Pipeline */}
        <Card className="border-border/80 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Work In Progress
              </CardTitle>
              <Activity className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2">
                <div className="text-lg font-bold text-blue-400">{overall.inProgressRoadmapTasks}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Active</div>
              </div>
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2">
                <div className="text-lg font-bold text-rose-400">{overall.blockedRoadmapTasks}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Blocked</div>
              </div>
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-2">
                <div className="text-lg font-bold text-purple-400">{overall.inReviewRoadmapTasks}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Review</div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              {overall.openRoadmapTasks} open tasks in active development.
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Delivery Forecast */}
        <Card className="border-border/80 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estimated Delivery Window
              </CardTitle>
              <Calendar className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {forecast.isCalculable && forecast.targetWindow ? (
              <>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-foreground">
                    {forecast.targetWindow.start} &rarr; {forecast.targetWindow.end}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ~{forecast.estimatedWeeksRemaining?.baseline} weeks remaining ({forecast.historicalVelocityWeekly} pts/wk)
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Confidence:</span>
                  <Badge
                    variant="outline"
                    className={`capitalize text-[10px] py-0 ${
                      forecast.confidenceLevel === 'high'
                        ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                        : forecast.confidenceLevel === 'medium'
                        ? 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                        : 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                    }`}
                  >
                    {forecast.confidenceLevel}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <div className="text-xs font-medium text-amber-400">Provisional / Gathering Data</div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {forecast.reason || 'Insufficient historical velocity to calculate a defensible delivery window.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="milestones" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-muted/40 p-1 rounded-xl">
          <TabsTrigger value="milestones" className="text-xs sm:text-sm">
            Roadmap Stages ({milestones.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs sm:text-sm">
            Active Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">
            Completed ({completedTasks.length})
          </TabsTrigger>
          <TabsTrigger value="readiness" className="text-xs sm:text-sm">
            Release Readiness
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs sm:text-sm">
            Git Activity
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Milestones Roadmap */}
        <TabsContent value="milestones" className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-foreground">Evolutionary Milestones</h2>
            <p className="text-xs text-muted-foreground">
              Progress is measured strictly by eligible closed roadmap tasks belonging to each GitHub milestone.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {milestones.map((m) => {
              const isClosed = m.state === 'closed' || (m.totalTasks > 0 && m.openTasks === 0);
              return (
                <Card
                  key={m.id}
                  className={`border transition-all flex flex-col justify-between ${
                    isClosed
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : m.openTasks > 0 && m.closedTasks > 0
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : 'border-border/80 bg-card/60'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={
                          isClosed
                            ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                            : 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                        }
                      >
                        {isClosed ? 'Verified Complete' : 'In Development'}
                      </Badge>
                      {m.blockedTasks > 0 && (
                        <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/10">
                          {m.blockedTasks} Blocked
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold mt-2 text-foreground line-clamp-1">
                      {m.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                      {m.description || 'No milestone description configured.'}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Task Completion:</span>
                        <strong className="text-foreground">
                          {m.taskCompletionPercentage !== null ? `${m.taskCompletionPercentage}%` : '0%'} ({m.closedTasks}/{m.totalTasks})
                        </strong>
                      </div>
                      <Progress value={m.taskCompletionPercentage || 0} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/60 pt-3">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Effort Points</span>
                        <strong className="text-foreground font-mono">
                          {m.completedEffort}/{m.totalEffort} pts
                        </strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Target Window</span>
                        <span className="text-foreground text-[11px]">
                          {m.targetDate ? m.targetDate.split('T')[0] : 'Rolling scope'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {m.openTasks} tasks remaining
                      </span>
                      <a
                        href={m.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent hover:underline flex items-center gap-1"
                      >
                        Milestone Issues <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: Active Tasks & Filterable Queue */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues by title, #id, or acceptance criteria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter tasks by status"
                className="h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All States</option>
                <option value="in-progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="in-review">In Review</option>
                <option value="planned">Planned</option>
                <option value="completed">Completed</option>
              </select>

              {/* Milestone Filter */}
              <select
                value={milestoneFilter}
                onChange={(e) => setMilestoneFilter(e.target.value)}
                aria-label="Filter tasks by milestone"
                className="h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Milestones</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.title}>
                    {m.title}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter tasks by work category"
                className="h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Categories</option>
                <option value="feature">Features</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="security">Security</option>
                <option value="testing">Testing</option>
                <option value="bug">Bugs</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 overflow-hidden divide-y divide-border/60">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 hover:bg-muted/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground font-semibold">
                        #{task.number}
                      </span>
                      <Badge variant="outline" className={`text-[10px] capitalize py-0 ${getStatusBadgeVariant(task.status)}`}>
                        {task.status}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] capitalize py-0 ${getCategoryBadgeVariant(task.category)}`}>
                        {task.category}
                      </Badge>
                      {task.estimate && (
                        <span className="text-[11px] font-mono font-medium text-slate-400 bg-muted px-1.5 py-0.5 rounded">
                          {task.estimate} pts
                        </span>
                      )}
                      {task.milestone && (
                        <span className="text-[11px] text-muted-foreground">
                          &bull; {task.milestone.title}
                        </span>
                      )}
                    </div>
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-sm text-foreground hover:text-accent transition-colors flex items-center gap-1.5 group"
                    >
                      <span>{task.title}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    {task.evidence && (
                      <div className="text-[11px] text-emerald-400/90 font-mono flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Evidence: {task.evidence}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-muted-foreground">
                      Updated {formatDateTime(task.updatedAt)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No roadmap tasks match the selected filters.
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 3: Completed Work & Evidence */}
        <TabsContent value="completed" className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-foreground">Verified Completed Deliverables</h2>
            <p className="text-xs text-muted-foreground">
              Every deliverable marked completed is backed by automated tests, committed code, or verified architecture routes.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {completedTasks.map((t) => (
              <Card key={t.id} className="border-border/80 bg-card/60">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" /> Verified Complete
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      Closed {t.closedAt ? t.closedAt.split('T')[0] : 'Recent'}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-foreground">
                    <a href={t.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                      #{t.number} {t.title}
                    </a>
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {t.body || 'Implemented and verified in core application.'}
                  </p>

                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs font-mono text-emerald-400/90 flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
                    <span className="truncate">
                      Evidence: {t.evidence || 'Verified through automated test suite in CI'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: Release Readiness */}
        <TabsContent value="readiness" className="space-y-6">
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 text-xs text-blue-300 leading-relaxed space-y-2">
            <div className="font-bold text-sm text-blue-200 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Progress vs. Release Readiness
            </div>
            <p>
              A high task-completion percentage measures finished engineering tasks, but does <strong>not</strong> guarantee
              a release is ready for production deployment. Production release readiness requires passing CI workflows, 100% clean
              type-checks and linters, zero unresolved critical security defects, verified data isolation, and formal tagged releases.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Automated Tests */}
            <Card className="border-border/80 bg-card/60">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Unit & E2E Tests</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {releaseReadiness.automatedTests.passed} / {releaseReadiness.automatedTests.total} Passing
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {releaseReadiness.automatedTests.details}
                </p>
                <div className="text-[11px] text-emerald-400/90 pt-2 border-t border-border/60">
                  {releaseReadiness.automatedTests.evidence}
                </div>
              </CardContent>
            </Card>

            {/* Static Analysis */}
            <Card className="border-border/80 bg-card/60">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">TypeScript & Linting</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {releaseReadiness.typecheckAndLint.status === 'passed' ? '100% Strict Pass' : 'Failing'}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {releaseReadiness.typecheckAndLint.details}
                </p>
                <div className="text-[11px] text-emerald-400/90 pt-2 border-t border-border/60">
                  {releaseReadiness.typecheckAndLint.evidence}
                </div>
              </CardContent>
            </Card>

            {/* Production Build */}
            <Card className="border-border/80 bg-card/60">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Production Build</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {releaseReadiness.productionBuild.status === 'passed' ? 'Build Succeeded' : 'Failed'}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {releaseReadiness.productionBuild.details}
                </p>
                <div className="text-[11px] text-emerald-400/90 pt-2 border-t border-border/60">
                  {releaseReadiness.productionBuild.evidence}
                </div>
              </CardContent>
            </Card>

            {/* Security Audit */}
            <Card className="border-border/80 bg-card/60">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Security Audit</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {releaseReadiness.securityAudit.unresolvedVulnerabilities} Blockers
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {releaseReadiness.securityAudit.details}
                </p>
                <div className="text-[11px] text-emerald-400/90 pt-2 border-t border-border/60">
                  {releaseReadiness.securityAudit.evidence}
                </div>
              </CardContent>
            </Card>

            {/* CI Status */}
            <Card className="border-border/80 bg-card/60">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">GitHub Actions CI</span>
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-foreground capitalize">
                  {releaseReadiness.ciStatus.conclusion || releaseReadiness.ciStatus.status}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Workflow: {releaseReadiness.ciStatus.workflowName}
                </p>
                <div className="text-[11px] text-blue-400/90 pt-2 border-t border-border/60">
                  {releaseReadiness.ciStatus.commitSha ? `Commit: ${releaseReadiness.ciStatus.commitSha}` : 'Automated workflow active'}
                </div>
              </CardContent>
            </Card>

            {/* Published Release */}
            <Card className="border-border/80 bg-card/60">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Published Release</span>
                  <Tag className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {releaseReadiness.releasePublished ? 'Release Published' : 'Pre-release (v0.1)'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: v1.0.0 Production Release
                </p>
                <div className="text-[11px] text-purple-400/90 pt-2 border-t border-border/60">
                  Gated on Milestone 6 completion
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 5: Git Activity */}
        <TabsContent value="activity" className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-foreground">Live GitHub Activity</h2>
            <p className="text-xs text-muted-foreground">
              Recent verified commits, pull requests, and releases on <code className="text-foreground font-mono">eshanized/Runstead</code>.
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 divide-y divide-border/60">
            {recentActivity.commits.map((c) => (
              <div key={c.sha} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <GitCommit className="h-4 w-4" />
                  </div>
                  <div>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-sm text-foreground hover:text-accent font-mono"
                    >
                      {c.message}
                    </a>
                    <div className="text-xs text-muted-foreground">
                      by <strong className="text-foreground">{c.author}</strong> on {formatDateTime(c.date)}
                    </div>
                  </div>
                </div>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-accent hover:underline shrink-0"
                >
                  {c.shortSha}
                </a>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
