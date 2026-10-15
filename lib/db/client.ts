import { PrismaClient, Prisma } from '@prisma/client';

// Global singleton caching pattern for Next.js to prevent connection pool exhaustion during hot reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  appPrisma: PrismaClient | undefined;
};

/**
 * Validates and retrieves the required database connection string.
 * Fails fast with a descriptive error if environment variables are missing.
 */
export function getDatabaseUrl(role: 'admin' | 'app' = 'admin', isTest: boolean = false): string {
  if (isTest) {
    const testUrl = role === 'app' ? process.env.APP_DATABASE_TEST_URL : process.env.DATABASE_TEST_URL;
    if (testUrl) return testUrl;
  }

  const standardUrl = role === 'app' ? process.env.APP_DATABASE_URL : process.env.DATABASE_URL;
  if (standardUrl) return standardUrl;

  // Fallback to DATABASE_URL if APP_DATABASE_URL is not explicitly configured
  if (role === 'app' && process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

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
  createPrismaClient(process.env.DATABASE_URL);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Unprivileged Application Prisma Client (Simulates runstead_app unprivileged role with NOBYPASSRLS).
 */
export const appPrisma =
  globalForPrisma.appPrisma ??
  createPrismaClient(process.env.APP_DATABASE_URL || process.env.DATABASE_URL);

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
 * @param client Optional PrismaClient instance (defaults to unprivileged appPrisma or primary prisma).
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
