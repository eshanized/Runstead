import { prisma } from '../db/client.ts';
import { recordAuditEvent } from './audit.service.ts';
import type { Domain, DnsRecord } from '@prisma/client';

export interface RegisterDomainInput {
  customerId: string;
  domainName: string;
  registrar?: string;
  autoRenew?: boolean;
  price?: number;
  domainType?: string;
  nameservers?: string[];
}

export async function listDomains(tenantId: string, customerId?: string) {
  return prisma.domain.findMany({
    where: {
      tenantId,
      customerId: customerId || undefined,
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      _count: { select: { dnsRecords: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDomainById(tenantId: string, domainId: string) {
  return prisma.domain.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: domainId,
      },
    },
    include: {
      customer: true,
      dnsRecords: { orderBy: { host: 'asc' } },
    },
  });
}

export async function registerDomainRecord(
  tenantId: string,
  input: RegisterDomainInput,
  actorId?: string
): Promise<Domain> {
  const normalizedDomain = input.domainName.toLowerCase().trim();
  const now = new Date();
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);

  const domain = await prisma.domain.create({
    data: {
      tenantId,
      customerId: input.customerId,
      domainName: normalizedDomain,
      status: 'active',
      registrar: input.registrar || 'internal',
      autoRenew: input.autoRenew ?? true,
      price: input.price,
      domainType: input.domainType || 'registered',
      nameservers: input.nameservers || ['ns1.runstead.org', 'ns2.runstead.org'],
      registeredDate: now,
      expiryDate: expiry,
    },
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'domain.registered',
    resourceType: 'domain',
    resourceId: domain.id,
    payload: { domainName: domain.domainName },
  });

  return domain;
}

export async function createDnsRecord(
  tenantId: string,
  domainId: string,
  record: { type: string; host: string; value: string; ttl?: number; priority?: number },
  actorId?: string
): Promise<DnsRecord> {
  const created = await prisma.dnsRecord.create({
    data: {
      tenantId,
      domainId,
      type: record.type.toUpperCase(),
      host: record.host.trim(),
      value: record.value.trim(),
      ttl: record.ttl || 3600,
      priority: record.priority,
    },
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'dns_record.created',
    resourceType: 'dns_record',
    resourceId: created.id,
    payload: { type: created.type, host: created.host, value: created.value },
  });

  return created;
}

export async function deleteDnsRecord(
  tenantId: string,
  recordId: string,
  actorId?: string
): Promise<void> {
  await prisma.dnsRecord.delete({
    where: {
      tenantId_id: {
        tenantId,
        id: recordId,
      },
    },
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'dns_record.deleted',
    resourceType: 'dns_record',
    resourceId: recordId,
  });
}
