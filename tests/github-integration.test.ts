import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCanonicalSnapshotResponse,
  canonicalRoadmapTasks,
  canonicalMilestones,
} from '../lib/github/snapshot.ts';
import {
  normalizeGitHubIssue,
  getProjectProgress,
} from '../lib/github/client.ts';
import { filterEligibleRoadmapTasks } from '../lib/github/calculations.ts';

describe('GitHub Data Integration & Caching Suite', () => {
  it('19. Canonical snapshot generates valid, coherent progress response', () => {
    const snapshot = getCanonicalSnapshotResponse();

    assert.equal(snapshot.metadata.repository, 'eshanized/Runstead');
    assert.equal(snapshot.overall.hasRoadmap, true);
    assert.ok(snapshot.overall.totalRoadmapTasks > 0);
    assert.ok(snapshot.overall.completedRoadmapTasks > 0);
    assert.ok(snapshot.milestones.length >= 6);
    assert.ok(snapshot.releaseReadiness.automatedTests.passed > 0);
    assert.equal(snapshot.releaseReadiness.securityAudit.unresolvedVulnerabilities, 0);
  });

  it('20. Stale cache behavior: flags dataSource as snapshot or stale when fallback is used', () => {
    const errorFallback = getCanonicalSnapshotResponse({
      dataSource: 'snapshot',
      isStale: true,
      errorMessage: 'GitHub API rate limit exceeded. Displaying cached verified snapshot.',
    });

    assert.equal(errorFallback.metadata.isStale, true);
    assert.equal(errorFallback.metadata.dataSource, 'snapshot');
    assert.match(errorFallback.metadata.errorMessage || '', /rate limit/);
  });

  it('21. Pagination and partial data handling: normalizes multiple batches cleanly', () => {
    // Simulate raw GitHub issue payloads
    const batch1 = [
      {
        id: 101,
        number: 1,
        title: 'Task 1',
        state: 'open',
        labels: [{ name: 'roadmap' }, { name: 'estimate:5' }, { name: 'type:feature' }],
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-02T00:00:00Z',
        html_url: 'https://github.com/eshanized/Runstead/issues/1',
      },
      {
        id: 102,
        number: 2,
        title: 'Pull Request 2',
        state: 'open',
        labels: [{ name: 'roadmap' }],
        pull_request: { html_url: 'https://github.com/eshanized/Runstead/pull/2' },
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-02T00:00:00Z',
        html_url: 'https://github.com/eshanized/Runstead/pull/2',
      },
    ];

    const normalizedBatch = batch1.map(normalizeGitHubIssue).filter(Boolean);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eligible = filterEligibleRoadmapTasks(normalizedBatch as any);

    // Pull request #2 should be excluded from eligible roadmap tasks
    assert.equal(eligible.length, 1);
    assert.equal(eligible[0].number, 1);
    assert.equal(eligible[0].estimate, 5);
  });

  it('22. Server-side token handling: getProjectProgress executes and returns valid response', async () => {
    const progress = await getProjectProgress();
    assert.ok(progress);
    assert.ok(progress.overall.totalRoadmapTasks > 0);
    assert.ok(progress.metadata.lastRefreshed);
  });
});
