import type { RoadmapTask, MilestoneSummary, DeliveryForecast, ScopeForecast } from './types.ts';

export interface ForecastOptions {
  currentDate?: Date;
  observationWindowWeeks?: number;
  minCompletedPointsRequired?: number;
  minEstimateCoveragePercent?: number;
}

/**
 * Calculates historical velocity within an observation window.
 * Avoids double-counting reopened tasks: only tasks currently closed/completed are evaluated.
 */
export function calculateHistoricalVelocity(
  tasks: RoadmapTask[],
  options: ForecastOptions = {}
): {
  weeklyVelocity: number | null;
  completedPointsInWindow: number;
  windowWeeks: number;
  closedTasksInWindow: number;
} {
  const currentDate = options.currentDate || new Date();
  const windowWeeks = options.observationWindowWeeks || 8;
  const windowMillis = windowWeeks * 7 * 24 * 60 * 60 * 1000;
  const windowStart = new Date(currentDate.getTime() - windowMillis);

  let completedPointsInWindow = 0;
  let closedTasksInWindow = 0;

  for (const task of tasks) {
    // Must be currently closed/completed and have an estimate
    if (task.state !== 'closed' && task.status !== 'completed') continue;
    if (task.estimate === null || task.estimate <= 0) continue;

    // Must have a reliable closedAt timestamp
    if (!task.closedAt) continue;

    const closedDate = new Date(task.closedAt);
    if (isNaN(closedDate.getTime())) continue;

    if (closedDate >= windowStart && closedDate <= currentDate) {
      completedPointsInWindow += task.estimate;
      closedTasksInWindow++;
    }
  }

  const weeklyVelocity =
    completedPointsInWindow > 0
      ? Math.round((completedPointsInWindow / windowWeeks) * 10) / 10
      : null;

  return {
    weeklyVelocity,
    completedPointsInWindow,
    windowWeeks,
    closedTasksInWindow,
  };
}

/**
 * Calculates delivery forecasts with explicit uncertainty ranges and confidence levels.
 */
export function calculateDeliveryForecast(
  tasks: RoadmapTask[],
  milestones: MilestoneSummary[],
  options: ForecastOptions = {}
): DeliveryForecast {
  const currentDate = options.currentDate || new Date();
  const windowWeeks = options.observationWindowWeeks || 8;
  const minPoints = options.minCompletedPointsRequired ?? 10;
  const minCoverage = options.minEstimateCoveragePercent ?? 50;

  const { weeklyVelocity, completedPointsInWindow, closedTasksInWindow } =
    calculateHistoricalVelocity(tasks, {
      ...options,
      observationWindowWeeks: windowWeeks,
    });

  // Calculate remaining effort and coverage across all open eligible tasks
  const openTasks = tasks.filter((t) => t.state === 'open' && t.status !== 'completed');
  let remainingEffort = 0;
  let estimatedOpenCount = 0;
  const blockerTasks = tasks.filter((t) => t.status === 'blocked');

  for (const task of openTasks) {
    if (task.estimate !== null && task.estimate > 0) {
      remainingEffort += task.estimate;
      estimatedOpenCount++;
    }
  }

  const openCoverage =
    openTasks.length > 0 ? Math.round((estimatedOpenCount / openTasks.length) * 100) : 100;

  const blockers = blockerTasks.map((b) => `#${b.number}: ${b.title}`);
  const assumptions: string[] = [
    `Based on an observation window of past ${windowWeeks} weeks.`,
    `Measured completed velocity: ${weeklyVelocity !== null ? `${weeklyVelocity} pts/week` : 'None in window'}.`,
    `Estimate coverage for remaining tasks: ${openCoverage}% (${estimatedOpenCount}/${openTasks.length} tasks estimated).`,
    'Uncertainty buffer: 0.8x to 1.4x factor to account for integration dependencies.',
  ];

  // Check data sufficiency criteria
  if (openTasks.length === 0 && tasks.length > 0) {
    return {
      isCalculable: true,
      reason: 'All planned roadmap tasks are completed.',
      historicalWindowWeeks: windowWeeks,
      historicalVelocityWeekly: weeklyVelocity,
      remainingEffortPoints: 0,
      estimatedWeeksRemaining: { min: 0, baseline: 0, max: 0 },
      targetWindow: null,
      confidenceLevel: 'high',
      assumptions,
      blockers,
      scopeBreakdown: { nextMilestone: null, fullRoadmap: null },
      calculatedAt: currentDate.toISOString(),
    };
  }

  if (tasks.length === 0) {
    return {
      isCalculable: false,
      reason: 'No roadmap tasks configured yet.',
      historicalWindowWeeks: windowWeeks,
      historicalVelocityWeekly: null,
      remainingEffortPoints: 0,
      estimatedWeeksRemaining: null,
      targetWindow: null,
      confidenceLevel: 'insufficient',
      assumptions,
      blockers,
      scopeBreakdown: { nextMilestone: null, fullRoadmap: null },
      calculatedAt: currentDate.toISOString(),
    };
  }

  if (weeklyVelocity === null || completedPointsInWindow < minPoints) {
    return {
      isCalculable: false,
      reason: 'Not enough development history to estimate a reliable delivery window.',
      historicalWindowWeeks: windowWeeks,
      historicalVelocityWeekly: weeklyVelocity,
      remainingEffortPoints: remainingEffort,
      estimatedWeeksRemaining: null,
      targetWindow: null,
      confidenceLevel: 'insufficient',
      assumptions: [
        ...assumptions,
        `Requires at least ${minPoints} completed effort points within the observation window (found ${completedPointsInWindow} pts).`,
      ],
      blockers,
      scopeBreakdown: { nextMilestone: null, fullRoadmap: null },
      calculatedAt: currentDate.toISOString(),
    };
  }

  if (openCoverage < minCoverage) {
    return {
      isCalculable: false,
      reason: `Insufficient effort estimate coverage (${openCoverage}% < ${minCoverage}% required).`,
      historicalWindowWeeks: windowWeeks,
      historicalVelocityWeekly: weeklyVelocity,
      remainingEffortPoints: remainingEffort,
      estimatedWeeksRemaining: null,
      targetWindow: null,
      confidenceLevel: 'insufficient',
      assumptions: [
        ...assumptions,
        `Effort estimates must cover at least ${minCoverage}% of open roadmap tasks.`,
      ],
      blockers,
      scopeBreakdown: { nextMilestone: null, fullRoadmap: null },
      calculatedAt: currentDate.toISOString(),
    };
  }

  // Calculate baseline, min, and max weeks
  const baselineWeeks = Math.max(1, Math.round((remainingEffort / weeklyVelocity) * 10) / 10);
  const minWeeks = Math.max(1, Math.round(baselineWeeks * 0.8 * 10) / 10);
  const maxWeeks = Math.max(1, Math.round(baselineWeeks * 1.4 * 10) / 10);

  const startDate = new Date(currentDate.getTime() + minWeeks * 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(currentDate.getTime() + maxWeeks * 7 * 24 * 60 * 60 * 1000);

  // Confidence assessment
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
  if (openCoverage >= 80 && completedPointsInWindow >= 25 && blockers.length === 0) {
    confidenceLevel = 'high';
  } else if (openCoverage < 65 || blockers.length > 0 || completedPointsInWindow < 15) {
    confidenceLevel = 'low';
  }

  // Calculate Next Milestone breakdown
  const nextMilestoneSummary = milestones.find(
    (m) => m.state === 'open' && m.openTasks > 0
  );

  let nextMilestoneForecast: ScopeForecast | null = null;
  if (nextMilestoneSummary) {
    const nextRemainingEffort = nextMilestoneSummary.totalEffort - nextMilestoneSummary.completedEffort;
    const nextWeeks =
      weeklyVelocity > 0 ? Math.max(0.5, Math.round((nextRemainingEffort / weeklyVelocity) * 10) / 10) : null;

    nextMilestoneForecast = {
      title: nextMilestoneSummary.title,
      remainingEffort: nextRemainingEffort,
      estimatedWeeks: nextWeeks,
      targetWindow: nextWeeks
        ? {
            start: new Date(currentDate.getTime() + nextWeeks * 0.8 * 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            end: new Date(currentDate.getTime() + nextWeeks * 1.3 * 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
          }
        : null,
    };
  }

  const fullRoadmapForecast: ScopeForecast = {
    title: 'Complete Roadmap Target',
    remainingEffort,
    estimatedWeeks: baselineWeeks,
    targetWindow: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    },
  };

  return {
    isCalculable: true,
    historicalWindowWeeks: windowWeeks,
    historicalVelocityWeekly: weeklyVelocity,
    remainingEffortPoints: remainingEffort,
    estimatedWeeksRemaining: {
      min: minWeeks,
      baseline: baselineWeeks,
      max: maxWeeks,
    },
    targetWindow: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    },
    confidenceLevel,
    assumptions,
    blockers,
    scopeBreakdown: {
      nextMilestone: nextMilestoneForecast,
      fullRoadmap: fullRoadmapForecast,
    },
    calculatedAt: currentDate.toISOString(),
  };
}
