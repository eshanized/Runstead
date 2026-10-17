import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { requireCustomer, AuthenticationError } from '@/lib/auth/guards';
import { getHostingProvider } from '@/lib/providers/hosting/factory';
import { recordAuditEvent } from '@/lib/services/audit.service';

const actionSchema = z.object({
  action: z.enum([
    'get_summary',
    'create_database',
    'list_databases',
    'create_backup',
    'list_backups',
    'restart_service',
  ]),
  dbName: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params;
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId parameter is required' }, { status: 400 });
  }

  // 1. Authenticate customer
  let customer;
  try {
    const auth = await requireCustomer(tenantId, undefined, req);
    customer = auth.customer;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  // 2. Fetch service & verify ownership
  const service = await prisma.service.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: serviceId,
      },
    },
  });

  if (!service || service.customerId !== customer.id) {
    return NextResponse.json({ error: 'Service not found or unauthorized' }, { status: 404 });
  }

  if (service.status !== 'active') {
    return NextResponse.json({ error: `Cannot perform actions while service is in "${service.status}" state` }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const { action, dbName } = parsed.data;
  const username = service.username || 'unknown';

  // 3. Resolve hosting provider and verify capabilities
  const provider = await getHostingProvider(tenantId);
  const capabilities = provider.getCapabilities();

  try {
    switch (action) {
      case 'get_summary': {
        const summary = await provider.getAccountSummary(username);
        return NextResponse.json({ success: true, summary });
      }

      case 'create_database': {
        if (!capabilities.databaseManager) {
          return NextResponse.json(
            { error: 'Database management capability is not supported by the configured hosting provider.' },
            { status: 400 }
          );
        }
        if (!dbName) {
          return NextResponse.json({ error: 'dbName is required for create_database' }, { status: 400 });
        }
        const result = await provider.createDatabase(username, dbName);
        await recordAuditEvent(tenantId, {
          actorId: customer.id,
          actorType: 'customer',
          action: 'service.database_created',
          resourceType: 'service',
          resourceId: serviceId,
          payload: { dbName },
        });
        return NextResponse.json({ success: result.success, message: result.message });
      }

      case 'list_databases': {
        if (!capabilities.databaseManager) {
          return NextResponse.json({ databases: [] });
        }
        const databases = await provider.listDatabases(username);
        return NextResponse.json({ success: true, databases });
      }

      case 'create_backup': {
        if (!capabilities.backups) {
          return NextResponse.json(
            { error: 'Backup capability is not supported by the configured hosting provider.' },
            { status: 400 }
          );
        }
        const result = await provider.createBackup(username);
        await recordAuditEvent(tenantId, {
          actorId: customer.id,
          actorType: 'customer',
          action: 'service.backup_created',
          resourceType: 'service',
          resourceId: serviceId,
        });
        return NextResponse.json({ success: result.success, message: result.message });
      }

      case 'list_backups': {
        if (!capabilities.backups) {
          return NextResponse.json({ backups: [] });
        }
        const backups = await provider.listBackups(username);
        return NextResponse.json({ success: true, backups });
      }

      case 'restart_service': {
        await recordAuditEvent(tenantId, {
          actorId: customer.id,
          actorType: 'customer',
          action: 'service.restarted',
          resourceType: 'service',
          resourceId: serviceId,
        });
        return NextResponse.json({ success: true, message: `Service ${service.serviceName} restart initiated.` });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
