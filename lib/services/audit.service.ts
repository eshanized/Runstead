import { withTenantContext } from '../db/client.ts';
import { redactSensitiveData } from '../security/redact.ts';

export interface AuditEventData {
  actorId?: string;
  actorType?: 'user' | 'customer' | 'system' | 'api';
  action: string;
  resourceType: string;
  resourceId?: string;
  payload?: any;
  ipAddress?: string;
}

/**
 * Persists an immutable append-only audit event in PostgreSQL.
 * Redacts any sensitive keys (passwords, tokens, keys) prior to insertion.
 */
export async function recordAuditEvent(tenantId: string, event: AuditEventData): Promise<void> {
  try {
    const sanitizedPayload = event.payload ? redactSensitiveData(event.payload) : undefined;

    await withTenantContext(tenantId, (tx) => tx.auditEvent.create({
      data: {
        tenantId,
        actorId: event.actorId,
        actorType: event.actorType || 'user',
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        payload: sanitizedPayload,
        ipAddress: event.ipAddress,
      },
    }));
  } catch (err) {
    // Fail-safe: Audit recording should log error but not crash user request if DB is offline
    console.error('Failed to persist audit event:', err);
  }
}
