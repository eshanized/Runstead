import { z } from 'zod';

const FORBIDDEN_PLACEHOLDER_SECRETS = new Set([
  'runstead-production-auth-secret-change-in-env-32bytes',
  'runstead-credentials-encryption-key-32bytes',
  'change-me-to-a-secure-random-32-character-secret-in-production',
  'change-me-to-a-secure-random-32-character-encryption-key',
  'runstead-default-fallback-encryption-key-32b',
]);

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  APP_DATABASE_URL: z.string().optional(),
  DATABASE_TEST_URL: z.string().optional(),
  APP_DATABASE_TEST_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),

  // Payment Providers (Stripe)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Hosting Providers (cPanel / WHM)
  CPANEL_WHM_HOST: z.string().optional(),
  CPANEL_WHM_USER: z.string().optional(),
  CPANEL_WHM_API_TOKEN: z.string().optional(),

  // Email / Transactional Notifications
  EMAIL_FROM: z.string().email().default('notifications@runstead.org'),
  RESEND_API_KEY: z.string().optional(),

  // Demo & Simulation controls
  NEXT_PUBLIC_ENABLE_DEMO: z.string().default('true'),
  ALLOW_DEMO_MUTATIONS_ON_DB: z.string().default('false'),
  ALLOW_TEST_AUTH_OVERRIDE: z.string().optional(),
});

export type EnvConfig = z.infer<typeof baseEnvSchema> & {
  AUTH_SECRET: string;
  ENCRYPTION_KEY: string;
};

let parsedEnv: EnvConfig;

export function validateEnvironment(): EnvConfig {
  const raw = baseEnvSchema.parse(process.env);
  const isProd = raw.NODE_ENV === 'production';
  const isTest = raw.NODE_ENV === 'test';

  if (isProd) {
    const errors: string[] = [];

    if (!raw.AUTH_SECRET || raw.AUTH_SECRET.length < 32) {
      errors.push('AUTH_SECRET must be at least 32 characters long in production.');
    } else if (FORBIDDEN_PLACEHOLDER_SECRETS.has(raw.AUTH_SECRET)) {
      errors.push('AUTH_SECRET cannot use an insecure default placeholder secret in production.');
    }

    if (!raw.ENCRYPTION_KEY || raw.ENCRYPTION_KEY.length < 32) {
      errors.push('ENCRYPTION_KEY must be at least 32 characters long in production.');
    } else if (FORBIDDEN_PLACEHOLDER_SECRETS.has(raw.ENCRYPTION_KEY)) {
      errors.push('ENCRYPTION_KEY cannot use an insecure default placeholder secret in production.');
    }

    if (!raw.DATABASE_URL) {
      errors.push('DATABASE_URL is mandatory in production.');
    }

    if (!raw.APP_DATABASE_URL) {
      errors.push('APP_DATABASE_URL (restricted unprivileged role) is mandatory in production.');
    }

    if (errors.length > 0) {
      throw new Error(`CRITICAL PRODUCTION CONFIGURATION ERROR:\n- ${errors.join('\n- ')}`);
    }

    return {
      ...raw,
      AUTH_SECRET: raw.AUTH_SECRET!,
      ENCRYPTION_KEY: raw.ENCRYPTION_KEY!,
    };
  }

  // Development / Test configuration
  const devAuthSecret = raw.AUTH_SECRET || (isTest ? 'test-auth-secret-32-chars-minimum-key!!' : 'dev-only-local-auth-secret-32-chars-long!');
  const devEncryptionKey = raw.ENCRYPTION_KEY || (isTest ? 'test-encryption-key-32-chars-min-key!!' : 'dev-only-local-encryption-key-32-chars!');

  return {
    ...raw,
    AUTH_SECRET: devAuthSecret,
    ENCRYPTION_KEY: devEncryptionKey,
  };
}

export function getEnv(): EnvConfig {
  if (!parsedEnv) {
    parsedEnv = validateEnvironment();
  }
  return parsedEnv;
}

export const env = getEnv();
