import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  APP_DATABASE_URL: z.string().optional(),
  DATABASE_TEST_URL: z.string().optional(),
  APP_DATABASE_TEST_URL: z.string().optional(),
  AUTH_SECRET: z.string().min(16).default('runstead-production-auth-secret-change-in-env-32bytes'),
  ENCRYPTION_KEY: z.string().min(16).default('runstead-credentials-encryption-key-32bytes'),
  
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
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedEnv: EnvConfig;

export function getEnv(): EnvConfig {
  if (!parsedEnv) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.warn('⚠️ Environment configuration warnings:', result.error.format());
      parsedEnv = envSchema.parse({
        ...process.env,
        AUTH_SECRET: process.env.AUTH_SECRET || 'runstead-production-auth-secret-change-in-env-32bytes',
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'runstead-credentials-encryption-key-32bytes',
      });
    } else {
      parsedEnv = result.data;
    }
  }
  return parsedEnv;
}

export const env = getEnv();
