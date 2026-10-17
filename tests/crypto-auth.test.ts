import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, generateSecureToken, hashToken } from '../lib/security/crypto.ts';
import { encryptData, decryptData } from '../lib/security/encryption.ts';
import { checkRateLimit } from '../lib/security/rate-limit.ts';

describe('Cryptographic & Security Foundation Suite', () => {
  test('1. Password Hashing: creates unique salts and scrypt hashes', async () => {
    const pwd = 'CorrectHorseBatteryStaple123!';
    const hash1 = await hashPassword(pwd);
    const hash2 = await hashPassword(pwd);

    assert.ok(hash1.startsWith('scrypt$N=16384,r=8,p=1$'), 'Hash should match scrypt format');
    assert.notEqual(hash1, hash2, 'Salts must be randomly generated for identical passwords');
  });

  test('2. Password Verification: correctly validates matches and rejects mismatches', async () => {
    const pwd = 'SuperSecretPassword@2026';
    const hash = await hashPassword(pwd);

    const isMatch = await verifyPassword(pwd, hash);
    assert.equal(isMatch, true, 'Valid password must verify successfully');

    const wrongMatch = await verifyPassword('WrongPassword123', hash);
    assert.equal(wrongMatch, false, 'Incorrect password must be rejected');

    const malformed = await verifyPassword(pwd, 'invalid-hash-string');
    assert.equal(malformed, false, 'Malformed hash must safely fail closed');
  });

  test('3. Token Generation & Hashing: generates cryptographically secure 32-byte hex tokens', () => {
    const token1 = generateSecureToken(32);
    const token2 = generateSecureToken(32);

    assert.equal(token1.length, 64, '32 bytes hex encoded should be 64 characters');
    assert.notEqual(token1, token2, 'Consecutive tokens must be distinct');

    const hash1 = hashToken(token1);
    const hash2 = hashToken(token1);
    assert.equal(hash1, hash2, 'SHA-256 hash must be deterministic');
    assert.equal(hash1.length, 64, 'SHA-256 hex string should be 64 characters');
  });

  test('4. AES-256-GCM Encryption: encrypts and decrypts provider credentials authenticated', () => {
    const secretConfig = {
      host: 'cpanel.example.com',
      user: 'root',
      apiToken: 'WHM_SECRET_TOKEN_XYZ_987',
      port: 2087,
    };

    const encrypted = encryptData(secretConfig);
    assert.ok(encrypted.iv, 'Must generate IV');
    assert.ok(encrypted.tag, 'Must generate auth tag');
    assert.ok(encrypted.ciphertext, 'Must generate ciphertext');
    assert.notEqual(encrypted.ciphertext, JSON.stringify(secretConfig));

    const decrypted = decryptData<typeof secretConfig>(encrypted);
    assert.deepEqual(decrypted, secretConfig, 'Decrypted config must match original plaintext');
  });

  test('5. Rate Limiter: throttles requests exceeding max limit within time window', () => {
    const testId = `test-ip-${Date.now()}`;
    const opts = { windowMs: 1000, maxRequests: 3 };

    const r1 = checkRateLimit(testId, opts);
    assert.equal(r1.success, true);
    assert.equal(r1.remaining, 2);

    const r2 = checkRateLimit(testId, opts);
    assert.equal(r2.success, true);
    assert.equal(r2.remaining, 1);

    const r3 = checkRateLimit(testId, opts);
    assert.equal(r3.success, true);
    assert.equal(r3.remaining, 0);

    const r4 = checkRateLimit(testId, opts);
    assert.equal(r4.success, false, '4th request must be throttled');
  });
});
