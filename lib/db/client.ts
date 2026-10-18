import { PrismaClient, Prisma } from '@prisma/client';

// Keep both clients separate: administrative access is explicit, while production
// application queries use the restricted role and must run with a tenant context.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  appPrisma: PrismaClient | undefined;
};

function ensureDistinctProductionRoles(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const adminUrl = process.env.DATABASE_URL;
  const appUrl = process.env.APP_DATABASE_URL;
  if (!adminUrl || !appUrl) return; // required-variable validation reports missing values
  try {
    const admin = new URL(adminUrl);
    const app = new URL(appUrl);
    if (
      admin.username === app.username &&
      admin.hostname === app.hostname &&
      admin.port === app.port &&
      admin.pathname === app.pathname
    ) {
      throw new Error(
        'Production database-role violation: DATABASE_URL and APP_DATABASE_URL must use distinct database roles. The application role must not have BYPASSRLS.'
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('database-role violation')) throw error;
    throw new Error('Production database configuration contains an invalid connection URL.');
  }
}

/**
 * Validates and retrieves a connection string for the requested role.
 * Production never falls back from the restricted application role to DATABASE_URL.
 */
export function getDatabaseUrl(role: 'admin' | 'app' = 'admin', isTest: boolean = false): string {
  if (isTest) {
    const testUrl = role === 'app' ? process.env.APP_DATABASE_TEST_URL : process.env.DATABASE_TEST_URL;
    if (testUrl) return testUrl;
  }

  const isProd = process.env.NODE_ENV === 'production';

  if (role === 'app') {
    if (process.env.APP_DATABASE_URL) {
      ensureDistinctProductionRoles();
      return process.env.APP_DATABASE_URL;
    }
    if (isProd) {
      throw new Error(
        'Production security boundary violation: APP_DATABASE_URL must be configured for the unprivileged application role (runstead_app) with NOBYPASSRLS.'
      );
    }
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  }

  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  throw new Error(
    `Database configuration error: Missing connection URL for role "${role}" (isTest: ${isTest}). Ensure DATABASE_URL or APP_DATABASE_URL is set in environment.`
  );
}

/** Creates a configured PrismaClient instance. */
export function createPrismaClient(connectionUrl?: string): PrismaClient {
  const url = connectionUrl || process.env.DATABASE_URL;
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

/**
 * Administrative client for trusted setup, migrations, cross-tenant workers, and
 * specifically reviewed platform-administration operations. Do not use for normal
 * reseller or customer data access.
 */
export const adminPrisma =
  globalForPrisma.prisma ??
  createPrismaClient(getDatabaseUrl('admin', process.env.NODE_ENV === 'test'));

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = adminPrisma;
}

/**
 * Restricted application client. Production uses APP_DATABASE_URL; in development
 * and isolated tests it may use the local DATABASE_URL for convenience.
 */
export const appPrisma =
  globalForPrisma.appPrisma ??
  createPrismaClient(getDatabaseUrl('app', process.env.NODE_ENV === 'test'));

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.appPrisma = appPrisma;
}

/**
 * Backwards-compatible default:
 * - production: restricted application role (RLS enforced)
 * - development/test: administrative client for seed fixtures and local workflows
 *
 * Tenant-owned production operations still need withTenantContext. RLS blocks
 * them when context is absent; this alias never exposes the privileged client in
 * production.
 */
export const prisma = process.env.NODE_ENV === 'production' ? appPrisma : adminPrisma;

/**
 * Execute a database operation under transaction-local tenant context.
 * This is the normal entry point for production tenant-owned data.
 */
export async function withTenantContext<T>(
  tenantId: string,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  client: PrismaClient = appPrisma
): Promise<T> {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error('withTenantContext requires a valid, non-empty tenant identifier');
  }

  return client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
    return operation(tx);
  });
}

/** Database health check helper. */
export async function checkDatabaseConnection(client: PrismaClient = prisma): Promise<boolean> {
  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
