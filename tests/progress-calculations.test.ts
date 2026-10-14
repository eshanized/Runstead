import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseEstimateFromLabels,
  deriveWorkState,
  deriveWorkCategory,
  filterEligibleRoadmapTasks,
  calculateOverallMetrics,
  calculateMilestoneSummaries,
  calculateReleaseReadiness,
} from '../lib/github/calculations.ts';
import type { RoadmapTask, MilestoneSummary } from '../lib/github/types.ts';

describe('Progress Calculations & Data Normalization Suite', () => {
  it('1. Empty roadmap behavior: reports null completion instead of misleading 0%', () => {
    const tasks: RoadmapTask[] = [];
    const milestones: MilestoneSummary[] = [];
    const metrics = calculateOverallMetrics(tasks, milestones);

    assert.equal(metrics.hasRoadmap, false);
    assert.equal(metrics.totalRoadmapTasks, 0);
    assert.equal(metrics.completedRoadmapTasks, 0);
    assert.equal(metrics.taskCompletionPercentage, null);
    assert.equal(metrics.effortCompletionPercentage, null);
  });

  it('2. Correct completed and total task counts', () => {
    const tasks: RoadmapTask[] = [
      {
        id: 1,
        number: 1,
        title: 'Task 1',
        body: '',
        state: 'closed',
        status: 'completed',
        category: 'feature',
        milestone: null,
        estimate: 3,
        isRoadmap: true,
        labels: ['roadmap'],
        createdAt: '2026-09-01T00:00:00Z',
        closedAt: '2026-09-05T00:00:00Z',
        updatedAt: '2026-09-05T00:00:00Z',
        url: 'https://github.com/eshanized/Runstead/issues/1',
        evidence: null,
        pullRequest: null,
      },
      {
        id: 2,
        number: 2,
        title: 'Task 2',
        body: '',
        state: 'open',
        status: 'in-progress',
        category: 'feature',
        milestone: null,
        estimate: 5,
        isRoadmap: true,
        labels: ['roadmap', 'status:in-progress'],
        createdAt: '2026-09-02T00:00:00Z',
        closedAt: null,
        updatedAt: '2026-09-02T00:00:00Z',
        url: 'https://github.com/eshanized/Runstead/issues/2',
        evidence: null,
        pullRequest: null,
      },
      {
        id: 3,
        number: 3,
        title: 'Task 3',
        body: '',
        state: 'open',
        status: 'planned',
        category: 'feature',
        milestone: null,
        estimate: 2,
        isRoadmap: true,
        labels: ['roadmap'],
        createdAt: '2026-09-03T00:00:00Z',
        closedAt: null,
        updatedAt: '2026-09-03T00:00:00Z',
        url: 'https://github.com/eshanized/Runstead/issues/3',
        evidence: null,
        pullRequest: null,
      },
    ];

    const metrics = calculateOverallMetrics(tasks, []);
    assert.equal(metrics.hasRoadmap, true);
    assert.equal(metrics.totalRoadmapTasks, 3);
    assert.equal(metrics.completedRoadmapTasks, 1);
    assert.equal(metrics.openRoadmapTasks, 2);
    assert.equal(metrics.inProgressRoadmapTasks, 1);
    assert.equal(metrics.taskCompletionPercentage, 33.3);
  });

  it('3. Correct treatment of open, closed, blocked, and reopened tasks', () => {
    // If an issue was closed and reopened, its GitHub state is 'open'
    const isOpenReopened = true;
    const reopenedStatus = deriveWorkState(isOpenReopened, ['roadmap', 'status:blocked']);
    assert.equal(reopenedStatus, 'blocked');

    const isClosed = false;
    const closedStatus = deriveWorkState(isClosed, ['roadmap', 'status:in-progress']);
    assert.equal(closedStatus, 'completed');
  });

  it('4. Pull request exclusion: ignores PR items from Issues API', () => {
    const raw: RoadmapTask[] = [
      {
        id: 10,
        number: 10,
        title: 'A regular roadmap issue',
        body: '',
        state: 'open',
        status: 'planned',
        category: 'feature',
        milestone: null,
        estimate: 3,
        isRoadmap: true,
        labels: ['roadmap'],
        createdAt: '2026-09-01T00:00:00Z',
        closedAt: null,
        updatedAt: '2026-09-01T00:00:00Z',
        url: 'https://github.com/eshanized/Runstead/issues/10',
        evidence: null,
        pullRequest: null,
      },
      {
        id: 11,
        number: 11,
        title: 'A pull request returned by API',
        body: '',
        state: 'closed',
        status: 'completed',
        category: 'feature',
        milestone: null,
        estimate: 3,
        isRoadmap: true,
        labels: ['roadmap'],
        createdAt: '2026-09-01T00:00:00Z',
        closedAt: '2026-09-02T00:00:00Z',
        updatedAt: '2026-09-02T00:00:00Z',
        url: 'https://github.com/eshanized/Runstead/pull/11',
        evidence: null,
        pullRequest: {
          number: 11,
          title: 'A pull request',
          url: 'https://github.com/eshanized/Runstead/pull/11',
          mergedAt: '2026-09-02T00:00:00Z',
        },
      },
    ];

    const eligible = filterEligibleRoadmapTasks(raw);
    assert.equal(eligible.length, 1);
    assert.equal(eligible[0].number, 10);
  });

  it('5. Exclusion of issues without the roadmap label', () => {
    const raw: RoadmapTask[] = [
      {
        id: 20,
        number: 20,
        title: 'Roadmap task',
        body: '',
        state: 'open',
        status: 'planned',
        category: 'feature',
        milestone: null,
        estimate: 5,
        isRoadmap: true,
        labels: ['roadmap'],
        createdAt: '2026-09-01T00:00:00Z',
        closedAt: null,
        updatedAt: '2026-09-01T00:00:00Z',
        url: '',
        evidence: null,
        pullRequest: null,
      },
      {
        id: 21,
        number: 21,
        title: 'General question without roadmap label',
        body: '',
        state: 'open',
        status: 'planned',
        category: 'feature',
        milestone: null,
        estimate: null,
        isRoadmap: false,
        labels: ['question'],
        createdAt: '2026-09-01T00:00:00Z',
        closedAt: null,
        updatedAt: '2026-09-01T00:00:00Z',
        url: '',
        evidence: null,
        pullRequest: null,
      },
    ];

    const eligible = filterEligibleRoadmapTasks(raw);
    assert.equal(eligible.length, 1);
    assert.equal(eligible[0].number, 20);
  });

  it('6. Milestone-specific calculations', () => {
    const milestonesDef = [
      {
        id: 1,
        number: 1,
        title: 'Milestone Alpha',
        description: 'First stage',
        state: 'open' as const,
      },
    ];

    const tasks: RoadmapTask[] = [
      {
        id: 1,
        number: 1,
        title: 'Alpha task 1',
        body: '',
        state: 'closed',
        status: 'completed',
        category: 'feature',
        milestone: { id: 1, number: 1, title: 'Milestone Alpha', state: 'open' },
        estimate: 5,
        isRoadmap: true,
        labels: ['roadmap'],
        createdAt: '2026-09-01T00:00:00Z',
        closedAt: '2026-09-05T00:00:00Z',
        updatedAt: '2026-09-05T00:00:00Z',
        url: '',
        evidence: null,
        pullRequest: null,
      },
      {
        id: 2,
        number: 2,
        title: 'Alpha task 2',
        body: '',
        state: 'open',
        status: 'blocked',
        category: 'feature',
        milestone: { id: 1, number: 1, title: 'Milestone Alpha', state: 'open' },
        estimate: 3,
        isRoadmap: true,
        labels: ['roadmap', 'status:blocked'],
        createdAt: '2026-09-01T00:00:00Z',
        closedAt: null,
        updatedAt: '2026-09-01T00:00:00Z',
        url: '',
        evidence: null,
        pullRequest: null,
      },
    ];

    const summaries = calculateMilestoneSummaries(milestonesDef, tasks);
    assert.equal(summaries.length, 1);
    const alpha = summaries[0];
    assert.equal(alpha.totalTasks, 2);
    assert.equal(alpha.closedTasks, 1);
    assert.equal(alpha.openTasks, 1);
    assert.equal(alpha.blockedTasks, 1);
    assert.equal(alpha.taskCompletionPercentage, 50);
    assert.equal(alpha.totalEffort, 8);
    assert.equal(alpha.completedEffort, 5);
    assert.equal(alpha.effortCompletionPercentage, 62.5);
  });

  it('7. Correct effort-weighted progress', () => {
    // 2 tasks: Task 1 has 13 pts (closed), Task 2 has 2 pts (open)
    // Task completion: 50%
    // Effort completion: 13 / 15 = 86.7%
    const tasks: RoadmapTask[] = [
      {
        id: 1,
        number: 1,
        title: 'Major overhaul',
        body: '',
        state: 'closed',
        status: 'completed',
        category: 'feature',
        milestone: null,
        estimate: 13,
        isRoadmap: true,
        labels: ['roadmap'],
        createdAt: '2026-09-01T00:00:00Z',
        closedAt: '2026-09-05T00:00:00Z',
        updatedAt: '2026-09-05T00:00:00Z',
        url: '',
        evidence: null,
        pullRequest: null,
      },
      {
        id: 2,
        number: 2,
        title: 'Small tweak',
        body: '',
        state: 'open',
        status: 'planned',
        category: 'feature',
        milestone: null,
        estimate: 2,
        isRoadmap: true,
        labels: ['roadmap'],
        createdAt: '2026-09-01T00:00:00Z',
        closedAt: null,
        updatedAt: '2026-09-01T00:00:00Z',
        url: '',
        evidence: null,
        pullRequest: null,
      },
    ];

    const metrics = calculateOverallMetrics(tasks, []);
    assert.equal(metrics.taskCompletionPercentage, 50);
    assert.equal(metrics.effortCompletionPercentage, 86.7);
  });

  it('8. Missing and invalid estimates parsing', () => {
    assert.equal(parseEstimateFromLabels(['estimate:5']), 5);
    assert.equal(parseEstimateFromLabels(['est:8']), 8);
    assert.equal(parseEstimateFromLabels(['3-points']), 3);
    assert.equal(parseEstimateFromLabels(['13 pts']), 13);
    assert.equal(parseEstimateFromLabels(['estimate:invalid']), null);
    assert.equal(parseEstimateFromLabels(['type:feature', 'roadmap']), null);
  });

  it('9. Partial estimate coverage calculation', () => {
    // 4 tasks: 3 have estimates, 1 is unestimated
    const tasks: RoadmapTask[] = [
      { id: 1, number: 1, title: 'T1', body: '', state: 'open', status: 'planned', category: 'feature', milestone: null, estimate: 3, isRoadmap: true, labels: [], createdAt: '', closedAt: null, updatedAt: '', url: '', evidence: null, pullRequest: null },
      { id: 2, number: 2, title: 'T2', body: '', state: 'open', status: 'planned', category: 'feature', milestone: null, estimate: 5, isRoadmap: true, labels: [], createdAt: '', closedAt: null, updatedAt: '', url: '', evidence: null, pullRequest: null },
      { id: 3, number: 3, title: 'T3', body: '', state: 'open', status: 'planned', category: 'feature', milestone: null, estimate: 8, isRoadmap: true, labels: [], createdAt: '', closedAt: null, updatedAt: '', url: '', evidence: null, pullRequest: null },
      { id: 4, number: 4, title: 'T4', body: '', state: 'open', status: 'planned', category: 'feature', milestone: null, estimate: null, isRoadmap: true, labels: [], createdAt: '', closedAt: null, updatedAt: '', url: '', evidence: null, pullRequest: null },
    ];

    const metrics = calculateOverallMetrics(tasks, []);
    assert.equal(metrics.estimatedTaskCount, 3);
    assert.equal(metrics.unestimatedTaskCount, 1);
    assert.equal(metrics.effortCoveragePercentage, 75);
  });

  it('10. Duplicate issue prevention in filterEligibleRoadmapTasks', () => {
    const raw: RoadmapTask[] = [
      { id: 100, number: 42, title: 'Task 42', body: '', state: 'open', status: 'planned', category: 'feature', milestone: null, estimate: 3, isRoadmap: true, labels: ['roadmap'], createdAt: '', closedAt: null, updatedAt: '', url: '', evidence: null, pullRequest: null },
      { id: 101, number: 42, title: 'Duplicate Task 42', body: '', state: 'open', status: 'planned', category: 'feature', milestone: null, estimate: 3, isRoadmap: true, labels: ['roadmap'], createdAt: '', closedAt: null, updatedAt: '', url: '', evidence: null, pullRequest: null },
    ];

    const filtered = filterEligibleRoadmapTasks(raw);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 100);
  });
});
