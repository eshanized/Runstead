import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { seedData } from '../lib/demo/seed-data.ts';
import type { DemoState, CapabilityId } from '../lib/demo/types.ts';
import * as workflows from '../lib/demo/workflows.ts';

describe('Hosting Control Center & Service Simulation Workflows', () => {
  let state: DemoState;
  const testServiceId = 'srv_001'; // Starter Hosting — sarahmitchell.com

  test('File Manager: create, read/update, rename, and delete file', () => {
    state = { ...seedData };
    const initialService = state.services.find((s) => s.id === testServiceId);
    assert.ok(initialService, 'Test service srv_001 must exist');

    // 1. Create file
    state = workflows.createServiceFile(state, testServiceId, {
      path: '/public_html/test-script.php',
      name: 'test-script.php',
      isDir: false,
      content: '<?php echo "Hello Runstead"; ?>',
    });
    let service = state.services.find((s) => s.id === testServiceId)!;
    const createdFile = service.fileSystem?.files.find((f) => f.path === '/public_html/test-script.php');
    assert.ok(createdFile, 'File must be created in simulated filesystem');
    assert.equal(createdFile?.content, '<?php echo "Hello Runstead"; ?>');

    // 2. Update file content
    state = workflows.updateServiceFileContent(
      state,
      testServiceId,
      '/public_html/test-script.php',
      '<?php echo "Updated Content"; ?>'
    );
    service = state.services.find((s) => s.id === testServiceId)!;
    const updatedFile = service.fileSystem?.files.find((f) => f.path === '/public_html/test-script.php');
    assert.equal(updatedFile?.content, '<?php echo "Updated Content"; ?>');

    // 3. Rename file
    state = workflows.renameServiceFile(
      state,
      testServiceId,
      '/public_html/test-script.php',
      'renamed-script.php'
    );
    service = state.services.find((s) => s.id === testServiceId)!;
    const oldFile = service.fileSystem?.files.find((f) => f.path === '/public_html/test-script.php');
    const renamedFile = service.fileSystem?.files.find((f) => f.path === '/public_html/renamed-script.php');
    assert.equal(oldFile, undefined, 'Old file path must no longer exist');
    assert.ok(renamedFile, 'Renamed file must exist at new path');
    assert.equal(renamedFile?.content, '<?php echo "Updated Content"; ?>');

    // 4. Delete file
    state = workflows.deleteServiceFile(state, testServiceId, '/public_html/renamed-script.php');
    service = state.services.find((s) => s.id === testServiceId)!;
    const deletedFile = service.fileSystem?.files.find((f) => f.path === '/public_html/renamed-script.php');
    assert.equal(deletedFile, undefined, 'Deleted file must not exist');
  });

  test('Database Management: create database, user with privileges, and deletion', () => {
    state = { ...seedData };

    // 1. Create database
    state = workflows.createServiceDatabase(state, testServiceId, 'wp_analytics');
    let service = state.services.find((s) => s.id === testServiceId)!;
    const db = service.databases?.find((d) => d.name === 'wp_analytics');
    assert.ok(db, 'Created database must exist');
    assert.equal(db?.collation, 'utf8mb4_unicode_ci');

    // 2. Create database user
    state = workflows.createServiceDatabaseUser(state, testServiceId, 'wp_analyst', ['SELECT', 'INSERT']);
    service = state.services.find((s) => s.id === testServiceId)!;
    const dbUser = service.databaseUsers?.find((u) => u.username === 'wp_analyst');
    assert.ok(dbUser, 'Created database user must exist');
    assert.ok(dbUser?.privileges.includes('SELECT'));

    // 3. Delete database user
    state = workflows.deleteServiceDatabaseUser(state, testServiceId, dbUser!.id);
    service = state.services.find((s) => s.id === testServiceId)!;
    assert.equal(service.databaseUsers?.some((u) => u.id === dbUser!.id), false);

    // 4. Delete database
    state = workflows.deleteServiceDatabase(state, testServiceId, db!.id);
    service = state.services.find((s) => s.id === testServiceId)!;
    assert.equal(service.databases?.some((d) => d.id === db!.id), false);
  });

  test('Email Management: create mailbox, forwarding rule, and deletion', () => {
    state = { ...seedData };

    // 1. Create email account
    state = workflows.createServiceEmailAccount(state, testServiceId, 'contact@sarahmitchell.com', 1024);
    let service = state.services.find((s) => s.id === testServiceId)!;
    const mailbox = service.emailAccounts?.find((a) => a.address.startsWith('contact@'));
    assert.ok(mailbox, 'Mailbox contact@ must be created');
    assert.equal(mailbox?.quotaMB, 1024);

    // 2. Create email forwarder
    state = workflows.createServiceEmailForwarder(
      state,
      testServiceId,
      'hello@sarahmitchell.com',
      'forward@external-corp.com'
    );
    service = state.services.find((s) => s.id === testServiceId)!;
    const fwd = service.emailForwarders?.find((f) => f.source === 'hello@sarahmitchell.com');
    assert.ok(fwd, 'Forwarder rule must be created');
    assert.equal(fwd?.destination, 'forward@external-corp.com');

    // 3. Delete forwarder
    state = workflows.deleteServiceEmailForwarder(state, testServiceId, fwd!.id);
    service = state.services.find((s) => s.id === testServiceId)!;
    assert.equal(service.emailForwarders?.some((f) => f.id === fwd!.id), false);

    // 4. Delete mailbox
    state = workflows.deleteServiceEmailAccount(state, testServiceId, mailbox!.id);
    service = state.services.find((s) => s.id === testServiceId)!;
    assert.equal(service.emailAccounts?.some((a) => a.id === mailbox!.id), false);
  });

  test('SSL / TLS Management: renew certificate and force HTTPS toggle', () => {
    state = { ...seedData };

    // Renew certificate
    state = workflows.renewServiceSslCertificate(state, testServiceId);
    let service = state.services.find((s) => s.id === testServiceId)!;
    assert.equal(service.sslCertificate?.status, 'active');
    assert.ok(service.sslCertificate?.expiryDate);

    // Verify expiry date is roughly 90 days in future
    const expiry = new Date(service.sslCertificate!.expiryDate).getTime();
    const now = Date.now();
    assert.ok(expiry > now + 80 * 24 * 60 * 60 * 1000, 'SSL certificate should be valid for ~90 days');

    // Toggle Force HTTPS
    const initialHttps = service.sslCertificate?.forceHttps ?? false;
    state = workflows.toggleServiceHttpsRedirect(state, testServiceId, !initialHttps);
    service = state.services.find((s) => s.id === testServiceId)!;
    assert.equal(service.sslCertificate?.forceHttps, !initialHttps);
  });

  test('Backups & Disaster Recovery: create on-demand snapshot, restore, and delete', () => {
    state = { ...seedData };

    // 1. Create on-demand backup
    state = workflows.createServiceBackup(state, testServiceId, 'full');
    let service = state.services.find((s) => s.id === testServiceId)!;
    const latestBackup = service.backups?.[0];
    assert.ok(latestBackup, 'New backup snapshot must be created');
    assert.equal(latestBackup?.scope, 'full');
    assert.equal(latestBackup?.status, 'completed');

    // 2. Restore backup
    state = workflows.restoreServiceBackup(state, testServiceId, latestBackup!.id);
    service = state.services.find((s) => s.id === testServiceId)!;
    const restoreEvent = service.timeline.find((t) => t.event.includes('Backup Restored'));
    assert.ok(restoreEvent, 'Timeline event must record backup restoration');

    // 3. Delete backup
    state = workflows.deleteServiceBackup(state, testServiceId, latestBackup!.id);
    service = state.services.find((s) => s.id === testServiceId)!;
    assert.equal(service.backups?.some((b) => b.id === latestBackup!.id), false);
  });

  test('VPS Infrastructure: power controls, SSH keys, and cloud firewall rules', () => {
    state = { ...seedData };
    const vpsServiceId = 'srv_004'; // VPS Pro — okaforhost.ng
    let service = state.services.find((s) => s.id === vpsServiceId)!;
    assert.ok(service, 'VPS service srv_004 must exist');

    // 1. Power State transitions
    state = workflows.setServiceVpsPowerState(state, vpsServiceId, 'stopped');
    service = state.services.find((s) => s.id === vpsServiceId)!;
    assert.equal(service.vpsData?.powerState, 'stopped');

    state = workflows.setServiceVpsPowerState(state, vpsServiceId, 'restarting');
    service = state.services.find((s) => s.id === vpsServiceId)!;
    assert.equal(service.vpsData?.powerState, 'restarting');

    state = workflows.setServiceVpsPowerState(state, vpsServiceId, 'running');
    service = state.services.find((s) => s.id === vpsServiceId)!;
    assert.equal(service.vpsData?.powerState, 'running');

    // 2. SSH Public Key
    state = workflows.addServiceVpsSshKey(
      state,
      vpsServiceId,
      'dev-laptop',
      'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGitHubUserTestingDemoKey== dev@local'
    );
    service = state.services.find((s) => s.id === vpsServiceId)!;
    const sshKey = service.vpsData?.sshKeys.find((k) => k.name === 'dev-laptop');
    assert.ok(sshKey, 'SSH key must be registered');

    state = workflows.deleteServiceVpsSshKey(state, vpsServiceId, sshKey!.id);
    service = state.services.find((s) => s.id === vpsServiceId)!;
    assert.equal(service.vpsData?.sshKeys.some((k) => k.id === sshKey!.id), false);

    // 3. Cloud Firewall Rules
    state = workflows.addServiceVpsFirewallRule(state, vpsServiceId, {
      portRange: '8080',
      protocol: 'TCP',
      source: '0.0.0.0/0',
      action: 'ALLOW',
      description: 'API Webhook Gateway',
    });
    service = state.services.find((s) => s.id === vpsServiceId)!;
    const fwRule = service.vpsData?.firewallRules.find((r) => r.portRange === '8080');
    assert.ok(fwRule, 'Firewall rule must be created');
    assert.equal(fwRule?.action, 'ALLOW');

    state = workflows.deleteServiceVpsFirewallRule(state, vpsServiceId, fwRule!.id);
    service = state.services.find((s) => s.id === vpsServiceId)!;
    assert.equal(service.vpsData?.firewallRules.some((r) => r.id === fwRule!.id), false);
  });

  test('Developer Tools: git deployment trigger, rollback, and masked env vars', () => {
    state = { ...seedData };

    // 1. Trigger Git Deploy
    state = workflows.triggerServiceDeployment(state, testServiceId, 'Release v1.2.0 automated rollout');
    let service = state.services.find((s) => s.id === testServiceId)!;
    assert.ok(service.devData?.deployments && service.devData.deployments.length > 0);
    const latestDeploy = service.devData.deployments[0];
    assert.equal(latestDeploy.status, 'success');

    // 2. Rollback Git Deploy if multiple exist
    if (service.devData && service.devData.deployments.length > 1) {
      const rollbackTarget = service.devData.deployments[1];
      state = workflows.rollbackServiceDeployment(state, testServiceId, rollbackTarget.id);
      service = state.services.find((s) => s.id === testServiceId)!;
      assert.ok(service.devData?.deployments[0].message.toLowerCase().includes('rollback'));
    }

    // 3. Add and delete environment variable
    state = workflows.addServiceEnvVar(state, testServiceId, 'STRIPE_SECRET_KEY', 'sk_live_1234567890', true);
    service = state.services.find((s) => s.id === testServiceId)!;
    const envVar = service.devData?.envVars.find((v) => v.key === 'STRIPE_SECRET_KEY');
    assert.ok(envVar, 'Environment variable must be set');
    assert.equal(envVar?.masked, true);

    state = workflows.deleteServiceEnvVar(state, testServiceId, envVar!.id);
    service = state.services.find((s) => s.id === testServiceId)!;
    assert.equal(service.devData?.envVars.some((v) => v.id === envVar!.id), false);
  });

  test('Reseller Configuration Cascade: updating product capabilities and limits propagates to active services', () => {
    state = { ...seedData };
    const targetProduct = state.products[0];
    const newCapabilities: CapabilityId[] = ['file_manager', 'databases', 'ssl_certificates'];

    // Update product capabilities and limits
    state = workflows.updateProductCapabilitiesAndLimits(state, targetProduct.id, newCapabilities, {
      storageGB: 50,
      bandwidthGB: 500,
      databases: 10,
      emailAccounts: 5,
    });

    const updatedProduct = state.products.find((p) => p.id === targetProduct.id)!;
    assert.deepEqual(updatedProduct.capabilities, newCapabilities);
    assert.equal(updatedProduct.planLimits?.storageGB, 50);

    // Verify cascade to all active services linked to targetProduct.id
    const linkedServices = state.services.filter((s) => s.productId === targetProduct.id);
    assert.ok(linkedServices.length > 0, 'Must have at least one linked service');
    for (const srv of linkedServices) {
      assert.deepEqual(srv.capabilities, newCapabilities, `Service ${srv.id} must inherit new capabilities`);
      assert.equal(srv.planLimits?.storageGB, 50, `Service ${srv.id} must inherit updated storage limit`);
    }
  });

  test('Hostname & Settings: update server hostname and verify activity logging', () => {
    state = { ...seedData };
    state = workflows.updateServiceHostname(state, testServiceId, 'node-us-east-99.runstead.net');
    const service = state.services.find((s) => s.id === testServiceId)!;
    assert.equal(service.serverHostname, 'node-us-east-99.runstead.net');
    assert.ok(service.logs?.some((l) => l.message.includes('node-us-east-99.runstead.net')));
  });
});
