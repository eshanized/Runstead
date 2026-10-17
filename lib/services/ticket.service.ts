import { prisma } from '../db/client.ts';
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
  const ticketNumber = `TICK-${timestamp}-${Math.floor(Math.random() * 900 + 100)}`;

  const result = await prisma.$transaction(async (tx) => {
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
    payload: {
      ticketNumber,
      subject: input.subject,
      category: input.category,
    },
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
    // 1. Append message
    const message = await tx.ticketMessage.create({
      data: {
        tenantId,
        ticketId,
        author: input.author,
        authorType: input.authorType,
        message: input.message,
        isInternal: input.isInternal ?? false,
      },
    });

    // 2. Update ticket status and timestamp
    const newStatus = input.authorType === 'customer' ? 'customer_reply' : 'answered';
    await tx.ticket.update({
      where: {
        tenantId_id: {
          tenantId,
          id: ticketId,
        },
      },
      data: {
        status: input.isInternal ? undefined : newStatus,
        updatedAt: new Date(),
      },
    });

    return message;
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: input.isInternal ? 'ticket.internal_note' : 'ticket.replied',
    resourceType: 'ticket',
    resourceId: ticketId,
    payload: {
      author: input.author,
      isInternal: input.isInternal,
    },
  });

  return result;
}

/**
 * Retrieves a ticket and its messages.
 * When called for the customer portal (isCustomerPortal = true),
 * automatically filters out staff internal notes!
 */
export async function getTicketWithMessages(
  tenantId: string,
  ticketId: string,
  isCustomerPortal: boolean = false
) {
  const ticket = await prisma.ticket.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: ticketId,
      },
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      messages: {
        where: isCustomerPortal ? { isInternal: false } : undefined,
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return ticket;
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

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.ticket.count({ where }),
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
