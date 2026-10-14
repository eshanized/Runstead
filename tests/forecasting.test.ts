import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHistoricalVelocity,
  calculateDeliveryForecast,
} from '../lib/github/forecasting.ts';
import type { RoadmapTask, MilestoneSummary } from '../lib/github/types.ts';
import { normalizeGitHubIssue } from '../lib/github/client.ts';

describe('Delivery Forecasting & Historical Velocity Suite', () => {
  const mockCurrentDate = new Date('2026-10-14T12:00:00Z');

  it('11. Handles tasks with missing completion dates safely without crash', () => {
    const tasks: RoadmapTask[] = [
      {
        id: 1,
        number: 1,
        title: 'Task closed with missing date',
        body: '',
        state: 'closed',
        status: 'completed',
        category: 'feature',
        milestone: null,
        estimate: 5,
        isRoadmap: true,
        labels: ['roadmap'],
        createdAt: '2026-09-01T00:00:00Z',
        closedAt: null, // missing date
        updatedAt: '2026-09-05T00:00:00Z',
        url: '',
        evidence: null,
        pullRequest: null,
      },
    ];

    const { completedPointsInWindow } = calculateHistoricalVelocity(tasks, {
      currentDate: mockCurrentDate,
      observationWindowWeeks: 8,
    });

    assert.equal(completedPointsInWindow, 0);
  });

  it('12. Reopened task history: ignores closedAt date if task is currently open', () => {
    const tasks: RoadmapTask[] = [
      {
        id: 2,
        number: 2,
        title: 'Reopened task',
        body: '',
        state: 'open', // Reopened!
        status: 'in-progress',
        category: 'feature',
        milestone: null,
        estimate: 8,
        isRoadmap: true,
        labels: ['roadmap', 'status:in-progress'],
        createdAt: '2026-09-01T00:00:00Z',
        closedAt: '2026-10-01T00:00:00Z', // historical closed date
        updatedAt: '2026-10-10T00:00:00Z',
        url: '',
        evidence: null,
        pullRequest: null,
      },
    ];

    const { completedPointsInWindow } = calculateHistoricalVelocity(tasks, {
      currentDate: mockCurrentDate,
      observationWindowWeeks: 8,
    });

    // Should NOT be counted as completed velocity
    assert.equal(completedPointsInWindow, 0);
  });

  it('13. Filters tasks closed outside of the observation window', () => {
    const tasks: RoadmapTask[] = [
      {
        id: 3,
        number: 3,
        title: 'Old task closed 6 months ago',
        body: '',
        state: 'closed',
        status: 'completed',
        category: 'feature',
        milestone: null,
        estimate: 13,
        isRoadmap: true,
        labels: ['roadmap'],
        createdAt: '2026-01-01T00:00:00Z',
        closedAt: '2026-02-01T00:00:00Z', // outside 8-week window
        updatedAt: '2026-02-01T00:00:00Z',
        url: '',
        evidence: null,
        pullRequest: null,
      },
      {
        id: 4,
        number: 4,
        title: 'Recent task closed 2 weeks ago',
        body: '',
        state: 'closed',
        status: 'completed',
        category: 'feature',
        milestone: null,
        estimate: 5,
        isRoadmap: true,
        labels: ['roadmap'],
        createdAt: '2026-09-20T00:00:00Z',
        closedAt: '2026-09-28T00:00:00Z', // inside 8-week window
        updatedAt: '2026-09-28T00:00:00Z',
        url: '',
        evidence: null,
        pullRequest: null,
      },
    ];

    const { completedPointsInWindow } = calculateHistoricalVelocity(tasks, {
      currentDate: mockCurrentDate,
      observationWindowWeeks: 8,
    });

    assert.equal(completedPointsInWindow, 5);
  });

  it('14. Sparse historical velocity: returns isCalculable: false with clear reason', () => {
    // Only 3 points completed in window (< minimum 10 points)
    const tasks: RoadmapTask[] = [
      {
        id: 5,
        number: 5,
        title: 'Only small task',
        body: '',
        state: 'closed',
        status: 'completed',
        category: 'feature',
        milestone: null,
        estimate: 3,
        isRoadmap: true,
        labels: ['roadmap'],
        createdAt: '2026-10-01T00:00:00Z',
        closedAt: '2026-10-05T00:00:00Z',
        updatedAt: '2026-10-05T00:00:00Z',
        url: '',
        evidence: null,
        pullRequest: null,
      },
      {
        id: 6,
        number: 6,
        title: 'Open work',
        body: '',
        state: 'open',
        status: 'planned',
        category: 'feature',
        milestone: null,
        estimate: 20,
        isRoadmap: true,
        labels: ['roadmap'],
        createdAt: '2026-10-01T00:00:00Z',
        closedAt: null,
        updatedAt: '2026-10-01T00:00:00Z',
        url: '',
        evidence: null,
        pullRequest: null,
      },
    ];

    const forecast = calculateDeliveryForecast(tasks, [], {
      currentDate: mockCurrentDate,
      minCompletedPointsRequired: 10,
    });

    assert.equal(forecast.isCalculable, false);
    assert.match(forecast.reason || '', /Not enough development history/);
    assert.equal(forecast.confidenceLevel, 'insufficient');
  });

  it('15. Scope growth: remaining effort updates when new tasks are added', () => {
    const tasksA: RoadmapTask[] = [
      { id: 1, number: 1, title: 'Closed A', body: '', state: 'closed', status: 'completed', category: 'feature', milestone: null, estimate: 16, isRoadmap: true, labels: [], createdAt: '', closedAt: '2026-10-01T00:00:00Z', updatedAt: '', url: '', evidence: null, pullRequest: null },
      { id: 2, number: 2, title: 'Open A', body: '', state: 'open', status: 'planned', category: 'feature', milestone: null, estimate: 10, isRoadmap: true, labels: [], createdAt: '', closedAt: null, updatedAt: '', url: '', evidence: null, pullRequest: null },
    ];

    const forecastA = calculateDeliveryForecast(tasksA, [], { currentDate: mockCurrentDate });
    assert.equal(forecastA.remainingEffortPoints, 10);

    // New task added (scope expansion)
    const tasksB: RoadmapTask[] = [
      ...tasksA,
      { id: 3, number: 3, title: 'New Open Task', body: '', state: 'open', status: 'planned', category: 'feature', milestone: null, estimate: 8, isRoadmap: true, labels: [], createdAt: '', closedAt: null, updatedAt: '', url: '', evidence: null, pullRequest: null },
    ];

    const forecastB = calculateDeliveryForecast(tasksB, [], { currentDate: mockCurrentDate });
    assert.equal(forecastB.remainingEffortPoints, 18);
  });

  it('16. Forecast calculation with uncertainty ranges', () => {
    // 24 points completed in 8 weeks = 3 points / week
    // 24 points remaining -> baseline = 8 weeks, min = 6.4 (approx 6), max = 11.2 (approx 11)
    const tasks: RoadmapTask[] = [
      { id: 1, number: 1, title: 'C1', body: '', state: 'closed', status: 'completed', category: 'feature', milestone: null, estimate: 12, isRoadmap: true, labels: [], createdAt: '', closedAt: '2026-09-20T00:00:00Z', updatedAt: '', url: '', evidence: null, pullRequest: null },
      { id: 2, number: 2, title: 'C2', body: '', state: 'closed', status: 'completed', category: 'feature', milestone: null, estimate: 12, isRoadmap: true, labels: [], createdAt: '', closedAt: '2026-10-01T00:00:00Z', updatedAt: '', url: '', evidence: null, pullRequest: null },
      { id: 3, number: 3, title: 'O1', body: '', state: 'open', status: 'planned', category: 'feature', milestone: null, estimate: 24, isRoadmap: true, labels: [], createdAt: '', closedAt: null, updatedAt: '', url: '', evidence: null, pullRequest: null },
    ];

    const forecast = calculateDeliveryForecast(tasks, [], {
      currentDate: mockCurrentDate,
      observationWindowWeeks: 8,
    });

    assert.equal(forecast.isCalculable, true);
    assert.equal(forecast.historicalVelocityWeekly, 3);
    assert.equal(forecast.remainingEffortPoints, 24);
    assert.ok(forecast.estimatedWeeksRemaining);
    assert.equal(forecast.estimatedWeeksRemaining.baseline, 8);
    assert.ok(forecast.estimatedWeeksRemaining.min < 8);
    assert.ok(forecast.estimatedWeeksRemaining.max > 8);
    assert.ok(forecast.targetWindow);
  });

  it('17. Forecast confidence reflects estimate coverage and blockers', () => {
    const milestones: MilestoneSummary[] = [
      {
        id: 1,
        number: 1,
        title: 'Milestone Beta',
        description: '',
        state: 'open',
        openTasks: 1,
        closedTasks: 1,
        totalTasks: 2,
        taskCompletionPercentage: 50,
        totalEffort: 30,
        completedEffort: 20,
        effortCompletionPercentage: 66.7,
        estimateCoveragePercentage: 100,
        blockedTasks: 1,
        inProgressTasks: 0,
        targetDate: null,
        htmlUrl: '',
      },
    ];

    // High points (30 completed), but a blocked task exists -> confidence drops to low
    const tasks: RoadmapTask[] = [
      { id: 1, number: 1, title: 'C1', body: '', state: 'closed', status: 'completed', category: 'feature', milestone: null, estimate: 30, isRoadmap: true, labels: [], createdAt: '', closedAt: '2026-10-01T00:00:00Z', updatedAt: '', url: '', evidence: null, pullRequest: null },
      { id: 2, number: 2, title: 'Blocked Work', body: '', state: 'open', status: 'blocked', category: 'feature', milestone: null, estimate: 10, isRoadmap: true, labels: ['status:blocked'], createdAt: '', closedAt: null, updatedAt: '', url: '', evidence: null, pullRequest: null },
    ];

    const forecast = calculateDeliveryForecast(tasks, milestones, {
      currentDate: mockCurrentDate,
    });

    assert.equal(forecast.isCalculable, true);
    assert.equal(forecast.confidenceLevel, 'low');
    assert.equal(forecast.blockers.length, 1);
  });

  it('18. Normalizes invalid GitHub issue payload safely without exceptions', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incompletePayload: any = {
      id: 999,
      number: 999,
      title: 'Missing various fields',
    };

    const normalized = normalizeGitHubIssue(incompletePayload);
    assert.ok(normalized);
    assert.equal(normalized.number, 999);
    assert.equal(normalized.isRoadmap, false);
    assert.equal(normalized.status, 'completed'); // state missing defaults to not open
    assert.equal(normalized.estimate, null);
  });
});
