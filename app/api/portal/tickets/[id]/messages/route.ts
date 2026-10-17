import { NextResponse } from 'next/server';
import { requireCustomer, AuthenticationError } from '@/lib/auth/guards';
import { getTicketWithMessages, replyTicket } from '@/lib/services/ticket.service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ticketId } = await params;
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

  // Ensure ticket belongs to authenticated customer
  const ticket = await getTicketWithMessages(customer.tenantId, ticketId);
  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  if (ticket.customerId !== customer.id && (ticket as any).customer_id !== customer.id) {
    return NextResponse.json({ error: 'Forbidden: Ticket does not belong to your account' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { message } = body;
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
  }

  try {
    const reply = await replyTicket(
      customer.tenantId,
      ticketId,
      {
        message: message.trim(),
        author: customer.name,
        authorType: 'customer',
        isInternal: false,
      },
      user.id
    );

    return NextResponse.json({ success: true, message: reply });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to post ticket message' },
      { status: 500 }
    );
  }
}
