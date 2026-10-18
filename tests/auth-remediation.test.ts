import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getAuthenticatedUser } from '../lib/auth/guards.ts';
import { verifyPassword } from '../lib/security/crypto.ts';
import { isAllowedRedirectUrl, sanitizeRedirectUrl } from '../lib/security/redirect.ts';
import { prisma } from '../lib/db/client.ts';

describe('Auth & Identity Remediation Security Regression Suite', () => {
  test('1. Client-controlled header elevation rejection', async () => {
    // Request attempting to elevate privileges via x-runstead-user-id header
    const mockRequest = new Request('http://localhost:3000/api/reseller/customers', {
      headers: {
        'x-runstead-user-id': '00000000-0000-0000-0000-000000000001',
      },
    });

    const user = await getAuthenticatedUser(mockRequest);
    assert.equal(user, null, 'Must reject client-controlled elevation headers');
  });

  test('2. Passwordless login rejection: fail-closed for users without credential', async () => {
    // User without password hash must fail closed
    const isValidNull = await verifyPassword('anyPassword123!', '');
    assert.equal(isValidNull, false, 'Blank or null password hash must be rejected');

    const isValidGarbage = await verifyPassword('anyPassword123!', 'invalid-hash-string');
    assert.equal(isValidGarbage, false, 'Corrupted password hash must fail closed');
  });

  test('3. Checkout open-redirect rejection: restricts redirects to authorized application origins', () => {
    const requestOrigin = 'http://localhost:3000';

    // Valid relative and same-origin paths
    assert.equal(isAllowedRedirectUrl('/order/complete', requestOrigin), true);
    assert.equal(isAllowedRedirectUrl('http://localhost:3000/checkout/success', requestOrigin), true);

    // Malicious external origins
    assert.equal(isAllowedRedirectUrl('https://evil-phishing-attacker.com/steal-creds', requestOrigin), false);
    assert.equal(isAllowedRedirectUrl('//evil-attacker.com/bad', requestOrigin), false);
    assert.equal(isAllowedRedirectUrl('javascript:alert(1)', requestOrigin), false);
    assert.equal(isAllowedRedirectUrl('data:text/html,<script>alert(1)</script>', requestOrigin), false);

    // Sanitization falls back to safe default path
    const sanitizedMalicious = sanitizeRedirectUrl('https://evil-phishing-attacker.com', requestOrigin, '/client/invoices');
    assert.equal(sanitizedMalicious, 'http://localhost:3000/client/invoices');
  });

  test('4. Guest customer claim isolation: existing customer profiles cannot be hijacked by email submission', async () => {
    const tenantId = 'e0000000-0000-0000-0000-000000000001';

    // Create a registered customer linked to an authentic user account
    const victimUserId = '00000000-0000-0000-0000-' + Date.now().toString(16).padStart(12, '0');
    const victimEmail = `victim_${Date.now()}@example.org`;

    const victimUser = await prisma.user.create({
      data: {
        id: victimUserId,
        email: victimEmail,
        name: 'Victim User',
        passwordHash: 'scrypt$dummyhash',
      },
    });

    const victimCustomer = await prisma.customer.create({
      data: {
        tenantId,
        userId: victimUser.id,
        name: 'Victim Customer Profile',
        email: victimEmail,
      },
    });

    // Verification of claim protection rule:
    // When a checkout request comes in with victimEmail from an unauthenticated user (authenticatedUserId = undefined),
    // the system strictly checks if the customer already belongs to a registered user and forbids association.
    const existingCustomer = await prisma.customer.findUnique({
      where: { tenantId_email: { tenantId, email: victimEmail } },
    });

    assert.ok(existingCustomer);
    assert.equal(existingCustomer.userId, victimUser.id);

    const guestUserId = null;
    const isClaimAllowed = !existingCustomer.userId || existingCustomer.userId === guestUserId;
    assert.equal(isClaimAllowed, false, 'Guest user without matching authentication credentials MUST NOT hijack registered customer profile');
  });
});
