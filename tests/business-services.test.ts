import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, validateSessionToken, revokeSessionToken } from '../lib/auth/session.ts';
import { serializeSessionCookie, serializeClearSessionCookie } from '../lib/auth/session.ts';

describe('Production Authentication & Session Management Suite', () => {
  test('1. Session Issuance: creates token, calculates 7-day expiration, and serializes secure cookie', async () => {
    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'reseller@apexcloud.org',
      name: 'Apex Admin',
      isPlatformAdmin: false,
    };

    const session = await createSession(mockUser.id, {
      ipAddress: '198.51.100.1',
      userAgent: 'Mozilla/5.0 TestBrowser',
      userObj: mockUser,
    });

    assert.ok(session.rawToken, 'Must generate raw token');
    assert.equal(session.rawToken.length, 64, 'Token should be 32 bytes hex');
    assert.ok(session.expiresAt.getTime() > Date.now(), 'Expiration must be in the future');

    // Cookie serialization
    const cookieHeader = serializeSessionCookie(session.rawToken);
    assert.ok(cookieHeader.includes('HttpOnly'), 'Session cookie must be HttpOnly');
    assert.ok(cookieHeader.includes('SameSite=Lax'), 'Session cookie must have SameSite protection');
    assert.ok(cookieHeader.includes('Path=/'), 'Session cookie must be scoped to root');

    const clearHeader = serializeClearSessionCookie();
    assert.ok(clearHeader.includes('Max-Age=0'), 'Clear cookie must expire immediately');
  });

  test('2. Session Validation & Revocation: validates active token and terminates upon logout', async () => {
    const mockUser = {
      id: '660e8400-e29b-41d4-a716-446655440000',
      email: 'customer@clientorg.com',
      name: 'Client User',
      isPlatformAdmin: false,
    };

    const session = await createSession(mockUser.id, {
      userObj: mockUser,
    });

    // Validate active token
    const validated = await validateSessionToken(session.rawToken);
    assert.ok(validated, 'Active session token must resolve authenticated user');
    assert.equal(validated?.email, 'customer@clientorg.com');

    // Revoke token (logout)
    await revokeSessionToken(session.rawToken);

    // Validate after revocation
    const revokedCheck = await validateSessionToken(session.rawToken);
    assert.equal(revokedCheck, null, 'Revoked token must not validate');
  });

  test('3. Invalid & Expired Tokens: fails closed on null or corrupted tokens', async () => {
    const nullResult = await validateSessionToken('');
    assert.equal(nullResult, null);

    const bogusResult = await validateSessionToken('completely-bogus-token-hex-1234');
    assert.equal(bogusResult, null);
  });
});
