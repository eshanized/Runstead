import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateSafeEndpoint, SsrfSecurityError, isPrivateIp } from '../lib/security/ssrf.ts';
import { redactSensitiveData } from '../lib/security/redact.ts';
import {
  assertProductionContext,
  assertSafeDemoProviderCall,
  ProductionBoundaryError,
  isDemoPathOrHeader,
} from '../lib/auth/boundary.ts';

describe('Security Controls & Boundary Enforcement Suite', () => {
  test('1. SSRF Protection: detects private, loopback, and metadata IP addresses', () => {
    assert.equal(isPrivateIp('127.0.0.1'), true);
    assert.equal(isPrivateIp('10.0.1.5'), true);
    assert.equal(isPrivateIp('192.168.1.1'), true);
    assert.equal(isPrivateIp('172.16.0.1'), true);
    assert.equal(isPrivateIp('169.254.169.254'), true);
    assert.equal(isPrivateIp('8.8.8.8'), false);
    assert.equal(isPrivateIp('1.1.1.1'), false);
    assert.equal(isPrivateIp('198.51.100.1'), false);
  });

  test('2. SSRF Protection: blocks cloud metadata hostnames', () => {
    assert.throws(
      () => validateSafeEndpoint('http://169.254.169.254/metadata'),
      SsrfSecurityError
    );
    assert.throws(
      () => validateSafeEndpoint('https://metadata.google.internal/computeMetadata'),
      SsrfSecurityError
    );
  });

  test('3. SSRF Protection: accepts valid public hosting endpoints', () => {
    const url = validateSafeEndpoint('https://cpanel.myhosting.com:2087');
    assert.equal(url.hostname, 'cpanel.myhosting.com');
    assert.equal(url.port, '2087');
  });

  test('4. Redaction: redacts passwords, tokens, API keys, and auth headers', () => {
    const sensitive = {
      user: 'admin',
      password: 'PlaintextPassword123!',
      apiKey: 'sk_live_1234567890abcdef',
      nested: {
        token: 'secret_jwt_token',
        publicField: 'safe_value',
      },
      list: [{ secret: 'xyz' }, { id: 'item_1' }],
    };

    const redacted = redactSensitiveData(sensitive);
    assert.equal(redacted.password, '[REDACTED]');
    assert.equal(redacted.apiKey, '[REDACTED]');
    assert.equal(redacted.nested.token, '[REDACTED]');
    assert.equal(redacted.nested.publicField, 'safe_value');
    assert.equal(redacted.list[0].secret, '[REDACTED]');
    assert.equal(redacted.list[1].id, 'item_1');
  });

  test('5. Production/Demo Boundary: strictly isolates demo context from production mutations', () => {
    // Assert production succeeds in production mode
    assert.doesNotThrow(() => assertProductionContext({ mode: 'production' }));

    // Assert production rejects demo mode
    assert.throws(
      () => assertProductionContext({ mode: 'demo' }),
      ProductionBoundaryError
    );

    // Assert safe provider routing
    assert.doesNotThrow(() => assertSafeDemoProviderCall('demo', 'sandbox_cpanel'));
    assert.throws(
      () => assertSafeDemoProviderCall('demo', 'stripe_live'),
      ProductionBoundaryError
    );

    // Path & header inspection
    assert.equal(isDemoPathOrHeader('/demo/overview'), true);
    assert.equal(isDemoPathOrHeader('/api/reseller/customers'), false);
    assert.equal(isDemoPathOrHeader('/api/reseller/customers', 'demo'), true);
  });
});
