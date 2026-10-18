import { withTenantContext } from '../db/client.ts';
import { recordAuditEvent } from './audit.service.ts';
import type { Ticket, TicketMessage, Prisma } from '@prisma/client';

export interface CreateTicketInput {
  customerId: string;
  subject: string;
  category: string;
  priority?: string;
  message: string;
  author: string;
  isCustomer: boolean;
}

export interface ReplyTicketInput {
  message: string;
  author: string;
  authorType: 'customer' | 'staff' | 'system';
  isInternal?: boolean;
}

export async function createTicket(
  tenantId: string,
  input: CreateTicketInput,
  actorId?: string
): Promise<{ ticket: Ticket; message: TicketMessage }> {
  const timestamp = Date.now().toString().slice(-6);
  const ticketNumber = `TCK-${timestamp}-${Math.floor(Math.random() * 900 + 100)}`;

  const result = await withTenantContext(tenantId, async (tx) => {
    const ticket = await tx.ticket.create({
      data: {
        tenantId,
        customerId: input.customerId,
        ticketNumber,
        subject: input.subject,
        category: input.category,
        priority: input.priority || 'medium',
        status: 'open',
      },
    });

    const message = await tx.ticketMessage.create({
      data: {
        tenantId,
        ticketId: ticket.id,
        author: input.author,
        authorType: input.isCustomer ? 'customer' : 'staff',
        message: input.message,
        isInternal: false,
      },
    });

    return { ticket, message };
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'ticket.created',
    resourceType: 'ticket',
    resourceId: result.ticket.id,
    payload: { subject: input.subject, ticketNumber },
  });

  return result;
}

export async function replyTicket(
  tenantId: string,
  ticketId: string,
  input: ReplyTicketInput,
  actorId?: string
): Promise<TicketMessage> {
  const result = await prisma.$transaction(async (tx) => {
    const message = await tx.ticketMessage.create({
      data: {
        tenantId,
        ticketId,
        author: input.author,
        authorType: input.authorType,
        message: input.message,
        isInternal: Boolean(input.isInternal),
      },
    });

    // Update ticket status
    const newStatus = input.authorType === 'customer' ? 'customer_reply' : 'answered';
    await tx.ticket.update({
      where: {
        tenantId_id: {
          tenantId,
          id: ticketId,
        },
      },
      data: { status: newStatus },
    });

    return message;
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'ticket.replied',
    resourceType: 'ticket',
    resourceId: ticketId,
    payload: { author: input.author, authorType: input.authorType },
  });

  return result;
}

export async function listTickets(
  tenantId: string,
  options: { customerId?: string; status?: string; page?: number; limit?: number } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.TicketWhereInput = {
    tenantId,
    customerId: options.customerId,
    status: options.status,
  };

  const [tickets, total] = await withTenantContext(tenantId, async (tx) => Promise.all([
    tx.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
    tx.ticket.count({ where }),
  ]);

  return {
    tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTicketById(tenantId: string, ticketId: string) {
  return withTenantContext(tenantId, (tx) => tx.ticket.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: ticketId,
      },
    },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: 'asc' } },
    },
  }));;
}

export const getTicketWithMessages = getTicketById;

export async function updateTicketStatus(
  tenantId: string,
  ticketId: string,
  status: string,
  actorId?: string
): Promise<Ticket> {
  const updated = await withTenantContext(tenantId, (tx) => tx.ticket.update({
    where: {
      tenantId_id: {
        tenantId,
        id: ticketId,
      },
    },
    data: { status },
  }));;

  await recordAuditEvent(tenantId, {
    actorId,
    action: `ticket.status_${status}`,
    resourceType: 'ticket',
    resourceId: ticketId,
    payload: { status },
  });

  return updated;
}
