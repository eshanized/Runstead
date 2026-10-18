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
