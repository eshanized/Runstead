import { withTenantContext } from '../db/client.ts';
import { extractTokenFromRequest, validateSessionToken } from './session.ts';
import type { AuthenticatedUser, ResellerStaffRole } from './types.ts';
import type { TenantMembership, Customer } from '@prisma/client';

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Access denied: insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Extracts and validates the authenticated user from the incoming request.
 * Header-based overrides and seeded fallback identities are strictly eliminated.
 */
export async function getAuthenticatedUser(req: Request): Promise<AuthenticatedUser | null> {
  const token = extractTokenFromRequest(req);
  if (token) {
    const user = await validateSessionToken(token);
    if (user) return user;
  }

  // Strictly isolated test-only authentication override (disabled in production and development)
  if (
    process.env.NODE_ENV === 'test' &&
    process.env.ALLOW_TEST_AUTH_OVERRIDE === 'true'
  ) {
    const testHeader = req.headers.get('x-test-user-id');
    if (testHeader) {
      return {
        id: testHeader,
        email: 'test-admin@runstead.test',
        name: 'Test Administrator',
        isPlatformAdmin: req.headers.get('x-test-is-admin') === 'true',
        emailVerified: new Date(),
      };
    }
  }

  return null;
}

/**
 * Enforces that a user is authenticated. Throws AuthenticationError if not.
 */
export async function requireAuthenticatedUser(req: Request): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    throw new AuthenticationError('Active session required. Please sign in.');
  }
  return user;
}

/**
 * Enforces that the authenticated user is a Platform Operator / Admin.
 */
export async function requirePlatformAdmin(req: Request): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser(req);
  if (!user.isPlatformAdmin) {
    throw new AuthorizationError('Platform administrator privileges required.');
  }
  return user;
}

/**
 * Enforces that the user is a staff member of the specified reseller tenant.
 * Optionally checks if their role is within allowedRoles.
 */
export async function requireResellerStaff(
  tenantId: string,
  allowedRoles?: ResellerStaffRole[],
  req?: Request
): Promise<{ user: AuthenticatedUser; membership: TenantMembership }> {
  if (!req) {
    throw new AuthenticationError('Request context missing');
  }

  const user = await requireAuthenticatedUser(req);

  // If the user is a platform admin, allow full access
  if (user.isPlatformAdmin) {
    return {
      user,
      membership: {
        id: 'admin-virtual-membership',
        tenantId,
        userId: user.id,
        role: 'owner',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  // Check tenant membership in PostgreSQL database
  const membership = await withTenantContext(tenantId, (tx) => tx.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId: user.id,
      },
    },
  }));

  if (!membership) {
    throw new AuthorizationError('You do not have access to this reseller tenant.');
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(membership.role as ResellerStaffRole)) {
      throw new AuthorizationError(`Insufficient role. Required: ${allowedRoles.join(', ')}. Found: ${membership.role}`);
    }
  }

  return { user, membership };
}

/**
 * Enforces that the user is an authorized end-customer for the given reseller tenant.
 * Customer association is ALWAYS resolved from the authenticated user's database record,
 * never from client-submitted parameters.
 */
export async function requireCustomer(
  tenantId: string,
  requestedCustomerId?: string,
  req?: Request
): Promise<{ user: AuthenticatedUser; customer: Customer }> {
  if (!req) {
    throw new AuthenticationError('Request context missing');
  }

  const user = await requireAuthenticatedUser(req);

  // Look up customer record in tenant linked to this user ID
  const customer = await withTenantContext(tenantId, (tx) => tx.customer.findFirst({
    where: {
      tenantId,
      userId: user.id,
      archived: false,
    },
  }));

  if (!customer) {
    throw new AuthorizationError('No customer profile associated with this account in this tenant.');
  }

  // If a specific customerId was requested in URL, verify it matches the authenticated customer
  if (requestedCustomerId && customer.id !== requestedCustomerId) {
    throw new AuthorizationError('Forbidden: Cross-customer access attempt blocked.');
  }

  return { user, customer };
}
