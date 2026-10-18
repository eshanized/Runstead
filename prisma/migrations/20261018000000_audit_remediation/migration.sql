-- Enforce unique provider-event idempotency keys per reseller tenant.
-- PostgreSQL still permits multiple NULL keys, preserving manual payments without a provider event key.
DROP INDEX IF EXISTS "payments_tenant_id_idempotency_key_idx";
CREATE UNIQUE INDEX "payments_tenant_id_idempotency_key_key"
  ON "payments"("tenant_id", "idempotency_key");

-- Shared, atomic rate limiting across application instances.
CREATE TABLE "rate_limit_buckets" (
  "key" VARCHAR(255) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "window_ends_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "rate_limit_buckets_window_ends_at_idx"
  ON "rate_limit_buckets"("window_ends_at");

-- Old integration routes could mark providers connected without a real API probe.
-- Require affected tenants to test these credentials again through the corrected endpoint.
UPDATE "provider_credentials"
SET "status" = 'error'
WHERE "status" = 'connected'
  AND "provider_name" IN ('stripe', 'resend', 'sendgrid', 'directadmin', 'custom_nameserver');

 
-- Single-use verification tokens are stored hashed; raw tokens are delivered only by email.
CREATE TABLE "email_verification_tokens" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token_hash" VARCHAR(64) NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "consumed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_verification_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key"
  ON "email_verification_tokens"("token_hash");
CREATE INDEX "email_verification_tokens_user_id_expires_at_idx"
  ON "email_verification_tokens"("user_id", "expires_at");

-- Grant restricted application access to the new verification and shared rate-limit tables.
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'runstead_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "rate_limit_buckets" TO runstead_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "email_verification_tokens" TO runstead_app;
  END IF;
END
$$;
