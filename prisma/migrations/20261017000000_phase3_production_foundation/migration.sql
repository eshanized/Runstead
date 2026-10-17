-- Migration: 20261017000000_phase3_production_foundation
-- Adds User email verification, global Sessions, Customer-User linkage, and Payment idempotency

-- 1. Alter users table
ALTER TABLE "users" ADD COLUMN "email_verified" TIMESTAMPTZ(6);

-- 2. Create sessions table
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Alter customers table
ALTER TABLE "customers" ADD COLUMN "user_id" UUID;
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "customers_user_id_idx" ON "customers"("user_id");

-- 4. Alter payments table
ALTER TABLE "payments" ADD COLUMN "idempotency_key" VARCHAR(255);
ALTER TABLE "payments" ADD COLUMN "metadata" JSONB;
CREATE INDEX "payments_tenant_id_idempotency_key_idx" ON "payments"("tenant_id", "idempotency_key");

-- 5. Grant access to unprivileged application role
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'runstead_app') THEN
    GRANT USAGE ON SCHEMA public TO runstead_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "sessions" TO runstead_app;
  END IF;
END
$$;
