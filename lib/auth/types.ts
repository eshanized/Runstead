export type ResellerStaffRole = 'owner' | 'admin' | 'billing' | 'support' | 'member';

export type AuthPrincipalType = 'platform_admin' | 'reseller_staff' | 'end_customer';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  isPlatformAdmin: boolean;
  emailVerified?: Date | null;
}

export interface AuthPrincipal {
  type: AuthPrincipalType;
  user: AuthenticatedUser;
  tenantId?: string;
  role?: ResellerStaffRole;
  customerId?: string;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  token: string;
  expiresAt: Date;
}
