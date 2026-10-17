import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SandboxHostingAdapter } from '../lib/providers/hosting/sandbox.ts';
import { CpanelWhmAdapter } from '../lib/providers/hosting/cpanel-whm.ts';

describe('Hosting Provider Integration Layer Suite', () => {
  test('1. Capabilities Registry: exposes accurate provider capabilities', () => {
    const sandbox = new SandboxHostingAdapter();
    const caps = sandbox.getCapabilities();

    assert.equal(caps.sharedHosting, true);
    assert.equal(caps.fileManager, true);
    assert.equal(caps.databaseManager, true);
    assert.equal(caps.backups, true);
    assert.equal(caps.vps, false); // Shared hosting adapter explicitly does not claim VPS
  });

  test('2. Sandbox Connection Test: returns successful health probe', async () => {
    const sandbox = new SandboxHostingAdapter();
    const health = await sandbox.testConnection();

    assert.equal(health.connected, true);
    assert.ok(health.version?.includes('cPanel-WHM'), 'Should report WHM-compatible version');
  });

  test('3. Account Provisioning Lifecycle: create, duplicate rejection, suspend, unsuspend, terminate', async () => {
    const sandbox = new SandboxHostingAdapter();
    const testUsername = `testu${Date.now().toString().slice(-4)}`;

    // Create
    const createRes = await sandbox.createAccount({
      domain: 'myteststore.com',
      username: testUsername,
      plan: 'Starter Plan',
      contactEmail: 'owner@myteststore.com',
    });

    assert.equal(createRes.success, true);
    assert.equal(createRes.username, testUsername);
    assert.equal(createRes.domain, 'myteststore.com');
    assert.ok(createRes.ipAddress, 'Must return assigned IP address');
    assert.ok(createRes.nameservers.length > 0, 'Must return assigned nameservers');

    // Duplicate rejection
    const duplicateRes = await sandbox.createAccount({
      domain: 'otherdomain.com',
      username: testUsername,
      plan: 'Starter Plan',
      contactEmail: 'other@example.com',
    });
    assert.equal(duplicateRes.success, false, 'Duplicate username must be rejected');

    // Account Summary
    const summary = await sandbox.getAccountSummary(testUsername);
    assert.equal(summary.username, testUsername);
    assert.equal(summary.status, 'active');

    // Suspend
    const suspendRes = await sandbox.suspendAccount(testUsername, 'Overdue payment');
    assert.equal(suspendRes.success, true);
    const summarySuspended = await sandbox.getAccountSummary(testUsername);
    assert.equal(summarySuspended.status, 'suspended');

    // Unsuspend
    const unsuspendRes = await sandbox.unsuspendAccount(testUsername);
    assert.equal(unsuspendRes.success, true);
    const summaryActive = await sandbox.getAccountSummary(testUsername);
    assert.equal(summaryActive.status, 'active');

    // Terminate
    const termRes = await sandbox.terminateAccount(testUsername);
    assert.equal(termRes.success, true);
  });

  test('4. Database & Backup Operations: create and list operations retain state', async () => {
    const sandbox = new SandboxHostingAdapter();
    const username = `dbuser${Date.now().toString().slice(-4)}`;

    await sandbox.createAccount({
      domain: 'appsite.org',
      username,
      plan: 'Pro Plan',
      contactEmail: 'db@appsite.org',
    });

    // Create Database
    const dbRes = await sandbox.createDatabase(username, 'shop_database');
    assert.equal(dbRes.success, true);

    const dbs = await sandbox.listDatabases(username);
    assert.ok(dbs.some((d) => d.name === 'shop_database'), 'Created database must appear in listing');

    // Create Backup
    const bakRes = await sandbox.createBackup(username);
    assert.equal(bakRes.success, true);

    const backups = await sandbox.listBackups(username);
    assert.ok(backups.length > 0, 'Created backup must be listed with size and timestamp');
    assert.equal(backups[0].status, 'available');
  });

  test('5. CpanelWhmAdapter Constructor: properly validates endpoint and capabilities', () => {
    const adapter = new CpanelWhmAdapter({
      host: 'whm.hostingprovider.com',
      user: 'root',
      apiToken: 'WHM_TOKEN_123',
    });

    assert.equal(adapter.name, 'cpanel_whm');
    assert.equal(adapter.isConfigured, true);
    const caps = adapter.getCapabilities();
    assert.equal(caps.sharedHosting, true);
    assert.equal(caps.sslManagement, true);
  });
});
