import { PrismaClient, Prisma } from '@prisma/client';

// Global singleton caching pattern for Next.js to prevent connection pool exhaustion during hot reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  appPrisma: PrismaClient | undefined;
};

/**
 * Validates and retrieves the required database connection string.
 * Enforces restricted application role in production without silent privileged fallback.
 */
export function getDatabaseUrl(role: 'admin' | 'app' = 'admin', isTest: boolean = false): string {
  if (isTest) {
    const testUrl = role === 'app' ? process.env.APP_DATABASE_TEST_URL : process.env.DATABASE_TEST_URL;
    if (testUrl) return testUrl;
  }

  const isProd = process.env.NODE_ENV === 'production';

  if (role === 'app') {
    if (process.env.APP_DATABASE_URL) {
      return process.env.APP_DATABASE_URL;
    }
    if (isProd) {
      throw new Error(
        'Production security boundary violation: APP_DATABASE_URL must be configured for the unprivileged application role (runstead_app) with NOBYPASSRLS.'
      );
    }
    // Only in non-production local development without APP_DATABASE_URL
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }
  }

  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  throw new Error(
    `Database configuration error: Missing connection URL for role "${role}" (isTest: ${isTest}). Ensure DATABASE_URL or APP_DATABASE_URL is set in environment.`
  );
}

/**
 * Creates a configured PrismaClient instance.
 */
export function createPrismaClient(connectionUrl?: string): PrismaClient {
  const url = connectionUrl || process.env.DATABASE_URL;
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

/**
 * Primary Administrative Prisma Client (Used for administrative tasks, migrations, and trusted setup).
 */
export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient(getDatabaseUrl('admin', process.env.NODE_ENV === 'test'));

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Unprivileged Application Prisma Client (Uses runstead_app unprivileged role with NOBYPASSRLS).
 */
export const appPrisma =
  globalForPrisma.appPrisma ??
  createPrismaClient(getDatabaseUrl('app', process.env.NODE_ENV === 'test'));

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.appPrisma = appPrisma;
}

/**
 * Helper to execute a database operation under an authenticated/trusted tenant context.
 * 
 * Enforces transactional isolation using PostgreSQL's `set_config('app.current_tenant_id', $1, true)`.
 * The 3rd argument `is_local = true` ensures the configuration parameter is strictly scoped
 * to the local transaction, guaranteeing automatic disposal on commit or rollback with zero pool leakage.
 * 
 * @param tenantId The validated UUID of the tenant.
 * @param operation Callback receiving the transaction client.
 * @param client Optional PrismaClient instance (defaults to unprivileged appPrisma).
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
    // Transaction-scoped context configuration (is_local = true)
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
    return operation(tx);
  });
}

/**
 * Database health check helper.
 */
export async function checkDatabaseConnection(client: PrismaClient = prisma): Promise<boolean> {
  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
