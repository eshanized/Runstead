export type WorkState = 'planned' | 'in-progress' | 'blocked' | 'in-review' | 'completed';

export type WorkCategory =
  | 'feature'
  | 'bug'
  | 'security'
  | 'testing'
  | 'documentation'
  | 'infrastructure';

export interface MilestoneRef {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
}

export interface RoadmapTask {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  status: WorkState;
  category: WorkCategory;
  milestone: MilestoneRef | null;
  estimate: number | null;
  isRoadmap: boolean;
  labels: string[];
  createdAt: string;
  closedAt: string | null;
  updatedAt: string;
  url: string;
  evidence: string | null;
  pullRequest: {
    number: number;
    title: string;
    url: string;
    mergedAt: string | null;
  } | null;
}

export interface MilestoneSummary {
  id: number;
  number: number;
  title: string;
  description: string;
  state: 'open' | 'closed';
  openTasks: number;
  closedTasks: number;
  totalTasks: number;
  taskCompletionPercentage: number | null;
  totalEffort: number;
  completedEffort: number;
  effortCompletionPercentage: number | null;
  estimateCoveragePercentage: number;
  blockedTasks: number;
  inProgressTasks: number;
  targetDate: string | null;
  htmlUrl: string;
}

export interface OverallMetrics {
  hasRoadmap: boolean;
  totalRoadmapTasks: number;
  completedRoadmapTasks: number;
  openRoadmapTasks: number;
  inProgressRoadmapTasks: number;
  blockedRoadmapTasks: number;
  inReviewRoadmapTasks: number;
  taskCompletionPercentage: number | null;
  totalEstimatedEffort: number;
  completedEstimatedEffort: number;
  effortCompletionPercentage: number | null;
  estimatedTaskCount: number;
  unestimatedTaskCount: number;
  effortCoveragePercentage: number;
  totalMilestones: number;
  completedMilestones: number;
}

export interface ScopeForecast {
  title: string;
  remainingEffort: number;
  estimatedWeeks: number | null;
  targetWindow: { start: string; end: string } | null;
}

export interface DeliveryForecast {
  isCalculable: boolean;
  reason?: string;
  historicalWindowWeeks: number;
  historicalVelocityWeekly: number | null;
  remainingEffortPoints: number;
  estimatedWeeksRemaining: {
    min: number;
    baseline: number;
    max: number;
  } | null;
  targetWindow: {
    start: string;
    end: string;
  } | null;
  confidenceLevel: 'high' | 'medium' | 'low' | 'insufficient';
  assumptions: string[];
  blockers: string[];
  scopeBreakdown: {
    nextMilestone: ScopeForecast | null;
    fullRoadmap: ScopeForecast | null;
  };
  calculatedAt: string;
}

export interface CIStatus {
  workflowName: string;
  status: 'completed' | 'in_progress' | 'queued' | 'not_configured';
  conclusion:
    | 'success'
    | 'failure'
    | 'neutral'
    | 'cancelled'
    | 'timed_out'
    | 'action_required'
    | null;
  runUrl?: string;
  commitSha?: string;
  updatedAt?: string;
}

export interface ReleaseStatus {
  latestTag: string | null;
  latestReleaseName: string | null;
  publishedAt: string | null;
  htmlUrl: string | null;
  totalReleases: number;
}

export interface VerificationCheck {
  status: 'passed' | 'failed' | 'not_configured' | 'unknown';
  label: string;
  evidence: string;
  details?: string;
}

export interface ReleaseReadiness {
  ciStatus: CIStatus;
  automatedTests: VerificationCheck & { total: number; passed: number };
  typecheckAndLint: VerificationCheck;
  productionBuild: VerificationCheck;
  securityAudit: VerificationCheck & { unresolvedVulnerabilities: number };
  criticalBlockers: number;
  releasePublished: boolean;
  isReadyForRelease: boolean;
  blockerDetails: string[];
}

export interface RecentCommit {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface RecentPullRequest {
  number: number;
  title: string;
  state: string;
  author: string;
  mergedAt: string | null;
  url: string;
}

export interface RecentRelease {
  tagName: string;
  name: string;
  publishedAt: string;
  url: string;
}

export interface ProjectProgressResponse {
  overall: OverallMetrics;
  milestones: MilestoneSummary[];
  tasks: RoadmapTask[];
  forecast: DeliveryForecast;
  releaseReadiness: ReleaseReadiness;
  recentActivity: {
    commits: RecentCommit[];
    pullRequests: RecentPullRequest[];
    releases: RecentRelease[];
  };
  metadata: {
    repository: string;
    lastRefreshed: string;
    isCached: boolean;
    isStale: boolean;
    dataSource: 'live' | 'cache' | 'snapshot' | 'unconfigured';
    rateLimitRemaining: number | null;
    rateLimitReset: string | null;
    errorMessage: string | null;
  };
}
