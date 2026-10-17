import { NextResponse } from 'next/server';
import { requireCustomer, AuthenticationError } from '@/lib/auth/guards';
import { listTickets, createTicket } from '@/lib/services/ticket.service';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

  let customer;
  try {
    const auth = await requireCustomer(tenantId, undefined, req);
    customer = auth.customer;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const status = url.searchParams.get('status') || undefined;

  const result = await listTickets(customer.tenantId, {
    customerId: customer.id,
    page,
    limit,
    status,
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

  let customer;
  let user;
  try {
    const auth = await requireCustomer(tenantId, undefined, req);
    customer = auth.customer;
    user = auth.user;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { subject, category, priority, message } = body;
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
  }

  try {
    const result = await createTicket(
      customer.tenantId,
      {
        customerId: customer.id,
        subject: subject.trim(),
        category: category || 'general',
        priority: priority || 'medium',
        message: message.trim(),
        author: customer.name,
        isCustomer: true,
      },
      user.id
    );

    return NextResponse.json({ success: true, ticket: result.ticket, message: result.message });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
