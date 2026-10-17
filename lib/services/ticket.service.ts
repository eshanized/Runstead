import { prisma } from '../db/client.ts';
import { getLocalDb, resolveLocalTenantId } from '../db/local-db.ts';
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

  try {
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
  } catch {
    const db = getLocalDb();
    const resolvedTenant = resolveLocalTenantId(tenantId);
    const ticketId = `t_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const msgId = `tm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tickets (id, tenant_id, customer_id, ticket_number, subject, category, priority, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ticketId,
      resolvedTenant,
      input.customerId,
      ticketNumber,
      input.subject,
      input.category,
      input.priority || 'medium',
      'open',
      now,
      now
    );

    db.prepare(`
      INSERT INTO ticket_messages (id, ticket_id, author, author_type, message, is_internal, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      msgId,
      ticketId,
      input.author,
      input.isCustomer ? 'customer' : 'staff',
      input.message,
      0,
      now
    );

    return {
      ticket: {
        id: ticketId,
        tenantId: resolvedTenant,
        customerId: input.customerId,
        ticketNumber,
        subject: input.subject,
        category: input.category,
        priority: input.priority || 'medium',
        status: 'open',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      } as any,
      message: {
        id: msgId,
        tenantId: resolvedTenant,
        ticketId,
        author: input.author,
        authorType: input.isCustomer ? 'customer' : 'staff',
        message: input.message,
        isInternal: false,
        createdAt: new Date(now),
      } as any,
    };
  }
}

export async function replyTicket(
  tenantId: string,
  ticketId: string,
  input: ReplyTicketInput,
  actorId?: string
): Promise<TicketMessage> {
  try {
    const result = await prisma.$transaction(async (tx) => {
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
  } catch {
    const db = getLocalDb();
    const resolvedTenant = resolveLocalTenantId(tenantId);
    const msgId = `tm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO ticket_messages (id, ticket_id, author, author_type, message, is_internal, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      msgId,
      ticketId,
      input.author,
      input.authorType,
      input.message,
      input.isInternal ? 1 : 0,
      now
    );

    const newStatus = input.authorType === 'customer' ? 'customer_reply' : 'answered';
    if (!input.isInternal) {
      db.prepare(`
        UPDATE tickets
        SET status = ?, updated_at = ?
        WHERE id = ?
      `).run(newStatus, now, ticketId);
    }

    return {
      id: msgId,
      tenantId: resolvedTenant,
      ticketId,
      author: input.author,
      authorType: input.authorType,
      message: input.message,
      isInternal: Boolean(input.isInternal),
      createdAt: new Date(now),
    } as any;
  }
}

export async function getTicketWithMessages(
  tenantId: string,
  ticketId: string,
  isCustomerPortal: boolean = false
) {
  try {
    return await prisma.ticket.findUnique({
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
  } catch {
    const db = getLocalDb();
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId) as any;
    if (!ticket) return null;
    const customer = db.prepare('SELECT id, name, email FROM customers WHERE id = ?').get(ticket.customer_id) as any;
    let query = 'SELECT * FROM ticket_messages WHERE ticket_id = ?';
    if (isCustomerPortal) {
      query += ' AND is_internal = 0';
    }
    query += ' ORDER BY created_at ASC';
    const messages = db.prepare(query).all(ticketId) as any[];

    return {
      ...ticket,
      ticketNumber: ticket.ticket_number,
      customer,
      messages: messages.map((m) => ({
        ...m,
        authorType: m.author_type,
        isInternal: Boolean(m.is_internal),
        createdAt: new Date(m.created_at),
      })),
    };
  }
}

export async function listTickets(
  tenantId: string,
  options: { customerId?: string; status?: string; page?: number; limit?: number } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  try {
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
  } catch {
    const db = getLocalDb();
    const resolvedTenant = resolveLocalTenantId(tenantId);
    let query = 'SELECT * FROM tickets WHERE tenant_id = ?';
    const params: (string | number)[] = [resolvedTenant];

    if (options.customerId) {
      query += ' AND customer_id = ?';
      params.push(options.customerId);
    }
    if (options.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    const countRow = db.prepare(`SELECT count(*) as count FROM (${query})`).get(...params) as { count: number };
    const total = countRow?.count || 0;

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, skip);

    const rows = db.prepare(query).all(...params) as any[];
    const tickets = rows.map((r) => {
      const cust = db.prepare('SELECT name, email FROM customers WHERE id = ?').get(r.customer_id) as any;
      const msgCount = db.prepare('SELECT count(*) as count FROM ticket_messages WHERE ticket_id = ?').get(r.id) as any;

      return {
        id: r.id,
        tenantId: r.tenant_id,
        customerId: r.customer_id,
        ticketNumber: r.ticket_number,
        subject: r.subject,
        category: r.category,
        priority: r.priority,
        status: r.status,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
        customer: cust || { name: 'Customer', email: 'user@example.com' },
        _count: { messages: msgCount?.count || 1 },
      };
    });

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
}
