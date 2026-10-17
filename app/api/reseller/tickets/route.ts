import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireResellerStaff, AuthenticationError } from '@/lib/auth/guards';
import { listTickets, createTicket, replyTicket } from '@/lib/services/ticket.service';

const createTicketSchema = z.object({
  customerId: z.string().uuid(),
  subject: z.string().min(3),
  category: z.string().min(2),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  message: z.string().min(5),
});

const replyTicketSchema = z.object({
  ticketId: z.string().uuid(),
  message: z.string().min(2),
  isInternal: z.boolean().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId parameter is required' }, { status: 400 });
  }

  try {
    await requireResellerStaff(tenantId, ['owner', 'admin', 'support'], req);
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const customerId = url.searchParams.get('customerId') || undefined;
  const status = url.searchParams.get('status') || undefined;

  const result = await listTickets(tenantId, { page, limit, customerId, status });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId parameter is required' }, { status: 400 });
  }

  let user;
  try {
    const auth = await requireResellerStaff(tenantId, ['owner', 'admin', 'support'], req);
    user = auth.user;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  // Check if reply or new ticket
  const isReply = typeof body === 'object' && body !== null && 'ticketId' in body;

  if (isReply) {
    const parsed = replyTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }
    const message = await replyTicket(
      tenantId,
      parsed.data.ticketId,
      {
        message: parsed.data.message,
        author: user.name,
        authorType: 'staff',
        isInternal: parsed.data.isInternal ?? false,
      },
      user.id
    );
    return NextResponse.json({ success: true, message }, { status: 201 });
  }

  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const result = await createTicket(
    tenantId,
    {
      customerId: parsed.data.customerId,
      subject: parsed.data.subject,
      category: parsed.data.category,
      priority: parsed.data.priority,
      message: parsed.data.message,
      author: user.name,
      isCustomer: false,
    },
    user.id
  );

  return NextResponse.json({ success: true, ticket: result.ticket, message: result.message }, { status: 201 });
}
