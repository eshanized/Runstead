'use client';

import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { z } from 'zod';
import type { DemoState } from './types';
import { seedData } from './seed-data';

import { migrateStorefrontConfig } from './storefront-presets';

export const CURRENT_STORAGE_VERSION = 'runstead_demo_v4';
export const LEGACY_STORAGE_KEYS = [
  'hostpilot_demo_v1',
  'hostpilot_demo_v2',
  'hostpilot_demo_v3',
  'runstead_demo_v1',
  'runstead_demo_v2',
  'runstead_demo_v3',
];

// Zod schemas for runtime schema-backed storage verification
const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  company: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive', 'suspended']),
  country: z.string(),
  createdAt: z.string(),
  phone: z.string().nullable().optional(),
  creditBalance: z.number(),
  servicesCount: z.number(),
  invoicesCount: z.number(),
  totalRevenue: z.number(),
  lastActivity: z.string(),
  activity: z.array(z.any()),
  archived: z.boolean().optional(),
}).passthrough();

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  description: z.string(),
  pricing: z.array(z.object({ cycle: z.string(), price: z.number() })),
  setupFee: z.number(),
  resourceLimits: z.array(z.object({ label: z.string(), value: z.string() })),
  available: z.boolean(),
  addons: z.array(z.any()),
}).passthrough();

const orderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  productId: z.string(),
  productName: z.string(),
  status: z.enum(['awaiting_payment', 'paid', 'provisioning', 'active', 'failed', 'canceled']),
  amount: z.number(),
  billingCycle: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  events: z.array(z.any()),
}).passthrough();

const serviceSchema = z.object({
  id: z.string(),
  serviceName: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  productId: z.string(),
  productName: z.string(),
  status: z.enum(['pending', 'active', 'suspended', 'canceled']),
  package: z.string(),
  domain: z.string().nullable().optional(),
  createdAt: z.string(),
  nextRenewalDate: z.string(),
  billingCycle: z.string(),
  price: z.number(),
  resourceUsage: z.array(z.any()),
  timeline: z.array(z.any()),
}).passthrough();

const domainSchema = z.object({
  id: z.string(),
  domain: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  registrar: z.string(),
  status: z.string(),
  registeredDate: z.string(),
  expiryDate: z.string(),
  autoRenew: z.boolean(),
  nameservers: z.array(z.string()),
  dnsZoneId: z.string().nullable().optional(),
});

const invoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'void', 'refunded']),
  issueDate: z.string(),
  dueDate: z.string(),
  paidDate: z.string().nullable().optional(),
  currency: z.string(),
  lineItems: z.array(z.any()),
  subtotal: z.number(),
  taxRate: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  payments: z.array(z.any()),
});

export const demoStateSchema = z.object({
  customers: z.array(customerSchema),
  products: z.array(productSchema),
  orders: z.array(orderSchema),
  services: z.array(serviceSchema),
  domains: z.array(domainSchema),
  dnsZones: z.array(z.any()),
  invoices: z.array(invoiceSchema),
  tickets: z.array(z.any()),
  storefront: z.object({
    businessName: z.string().optional(),
    primaryColor: z.string().optional(),
  }).passthrough(),
  integrations: z.array(z.any()),
  business: z.object({
    businessName: z.string(),
    legalName: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
    currency: z.string(),
    timezone: z.string(),
    taxRate: z.number(),
    taxId: z.string(),
    currentPlan: z.string(),
  }).passthrough(),
  notifications: z.array(z.any()),
  platformOperator: z.object({
    tenants: z.array(z.any()),
    events: z.array(z.any()),
    integrations: z.array(z.any()),
  }).optional(),
}).passthrough();

export function validateStoredDemoState(data: unknown): DemoState | null {
  const result = demoStateSchema.safeParse(data);
  if (!result.success) {
    return null;
  }
  const valid = result.data as unknown as DemoState;
  // Ensure platformOperator exists even if migrating from an earlier schema
  if (!valid.platformOperator) {
    valid.platformOperator = seedData.platformOperator;
  }
  // Migrate storefront to Storefront 2.0 schema
  valid.storefront = migrateStorefrontConfig(valid.storefront);
  if (!valid.publishedStorefront) {
    valid.publishedStorefront = valid.storefront;
  } else {
    valid.publishedStorefront = migrateStorefrontConfig(valid.publishedStorefront);
  }
  if (!Array.isArray(valid.cart)) {
    valid.cart = [];
  }
  if (!valid.activeClientCustomerId) {
    valid.activeClientCustomerId = 'cust_001';
  }
  return valid;
}

interface DemoContextValue {
  state: DemoState;
  setState: (updater: ((prev: DemoState) => DemoState) | DemoState) => void;
  resetDemo: () => void;
  isHydrated: boolean;
  syncFromServer: () => Promise<void>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const existing = useContext(DemoContext);
  if (existing) {
    return <>{children}</>;
  }
  return <DemoProviderInternal>{children}</DemoProviderInternal>;
}

function DemoProviderInternal({ children }: { children: React.ReactNode }) {
  const [state, setStateInternal] = useState<DemoState>(seedData);
  const [isHydrated, setIsHydrated] = useState(false);
  const isFirstRender = useRef(true);

  const syncServerState = useCallback(async () => {
    try {
      const res = await fetch('/api/reseller/sync?tenantId=default');
      if (!res.ok) return;
      const d = await res.json();

      setStateInternal((p) => {
        const next = { ...p };

        if (Array.isArray(d.customers) && d.customers.length > 0) {
          next.customers = d.customers.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            company: c.company || null,
            status: c.status || 'active',
            country: c.country || 'US',
            createdAt: c.createdAt || new Date().toISOString(),
            phone: c.phone || null,
            creditBalance: Number(c.creditBalance || 0),
            servicesCount: c._count?.services || 0,
            invoicesCount: c._count?.invoices || 0,
            totalRevenue: 0,
            lastActivity: c.createdAt || new Date().toISOString(),
            activity: [],
            archived: Boolean(c.archived),
          }));
        }

        if (Array.isArray(d.products) && d.products.length > 0) {
          next.products = d.products.map((pr: any) => ({
            id: pr.id,
            name: pr.name,
            type: pr.type,
            description: pr.description || '',
            pricing: Array.isArray(pr.pricing) ? pr.pricing : [{ cycle: 'monthly', price: Number(pr.pricing?.monthly || 19.99) }],
            setupFee: Number(pr.setupFee || 0),
            resourceLimits: pr.resourceLimits ? (Array.isArray(pr.resourceLimits) ? pr.resourceLimits : Object.entries(pr.resourceLimits).map(([label, value]) => ({ label, value: String(value) }))) : [],
            available: pr.available ?? true,
            addons: pr.addons || [],
            capabilities: pr.capabilities || ['file_manager', 'databases', 'domain_management', 'dns_zone', 'ssl_certificates', 'backups'],
            planLimits: pr.planLimits || {},
          }));
        }

        if (Array.isArray(d.orders) && d.orders.length > 0) {
          next.orders = d.orders.map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerId: o.customerId,
            customerName: o.customer?.name || 'Customer',
            productId: o.productId || 'prod_001',
            productName: o.product?.name || o.productName || 'Standard Hosting Plan',
            status: o.status,
            amount: Number(o.amount),
            billingCycle: o.billingCycle || 'monthly',
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
            events: [],
          }));
        }

        if (Array.isArray(d.invoices) && d.invoices.length > 0) {
          next.invoices = d.invoices.map((inv: any) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            customerId: inv.customerId,
            customerName: inv.customer?.name || 'Customer',
            orderId: inv.orderId || null,
            status: inv.status,
            subtotal: Number(inv.subtotal),
            tax: Number(inv.tax || 0),
            total: Number(inv.total),
            currency: inv.currency || 'USD',
            createdAt: inv.createdAt,
            dueDate: inv.dueDate || inv.createdAt,
            paidAt: inv.paidAt || null,
            items: Array.isArray(inv.items) ? inv.items : [],
            payments: inv.payments || [],
          }));
        }

        if (Array.isArray(d.services) && d.services.length > 0) {
          next.services = d.services.map((s: any) => ({
            id: s.id,
            serviceName: s.serviceName || `Service (${s.domain || 'Site'})`,
            customerId: s.customerId,
            customerName: s.customer?.name || 'Customer',
            productId: s.productId,
            productName: s.product?.name || s.package || 'Hosting Plan',
            status: s.status,
            package: s.package,
            domain: s.domain || null,
            createdAt: s.createdAt,
            nextRenewalDate: s.nextRenewalDate || new Date().toISOString(),
            billingCycle: s.billingCycle || 'monthly',
            price: Number(s.price),
            ipAddress: s.ipAddress || '198.51.100.45',
            serverHostname: s.serverHostname || 'srv1.runstead.net',
            username: s.username || 'client',
            capabilities: ['file_manager', 'databases', 'domain_management', 'dns_zone', 'ssl_certificates', 'backups'],
            resourceUsage: Array.isArray(s.resourceUsage) ? s.resourceUsage : [],
            fileSystem: { files: [] },
            databases: [],
            databaseUsers: [],
            emailAccounts: [],
            emailForwarders: [],
            emailLogs: [],
            sslCertificate: { status: 'active', issuer: "Let's Encrypt", autoRenew: true, forceHttps: true },
            backups: [],
            logs: [],
            timeline: [],
          }));
        }

        if (Array.isArray(d.tickets) && d.tickets.length > 0) {
          next.tickets = d.tickets.map((t: any) => ({
            id: t.id,
            ticketNumber: t.ticketNumber,
            customerId: t.customerId,
            customerName: t.customer?.name || 'Customer',
            subject: t.subject,
            category: t.category,
            priority: t.priority,
            status: t.status,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            messages: Array.isArray(t.messages) ? t.messages.map((m: any) => ({
              id: m.id,
              author: m.author,
              authorType: m.authorType,
              message: m.message,
              timestamp: m.createdAt,
              isInternal: Boolean(m.isInternal),
            })) : [],
          }));
        }

        if (Array.isArray(d.domains) && d.domains.length > 0) {
          next.domains = d.domains.map((dom: any) => ({
            id: dom.id,
            domain: dom.domain,
            customerId: dom.customerId,
            customerName: dom.customerName || (next.customers.find((c) => c.id === dom.customerId)?.name) || 'Customer',
            registrar: dom.registrar || 'Runstead Registrar',
            status: dom.status,
            registeredDate: dom.registeredDate,
            expiryDate: dom.expiryDate,
            autoRenew: Boolean(dom.autoRenew),
            nameservers: dom.nameservers || ['ns1.runstead.net', 'ns2.runstead.net'],
            dnsZoneId: dom.dnsZoneId || null,
          }));
        }

        if (d.tenant) {
          next.business = {
            ...next.business,
            businessName: d.tenant.name || next.business.businessName,
            currency: d.tenant.currency || next.business.currency,
            taxRate: d.tenant.taxRate !== undefined ? d.tenant.taxRate : next.business.taxRate,
            ...(d.tenant.business || {}),
          };
        }

        return next;
      });
    } catch {
      // Safe offline fallback
    }
  }, []);

  // Hydration effect: validate persisted storage safely
  useEffect(() => {
    try {
      const legacyStored =
        localStorage.getItem('runstead_demo_v2') ||
        localStorage.getItem('hostpilot_demo_v3') ||
        localStorage.getItem('hostpilot_demo_v2');
      const stored = localStorage.getItem(CURRENT_STORAGE_VERSION) || legacyStored;
      if (stored) {
        const parsed = JSON.parse(stored);
        const validated = validateStoredDemoState(parsed);
        if (validated) {
          setStateInternal(validated);
          localStorage.setItem(CURRENT_STORAGE_VERSION, JSON.stringify(validated));
        } else {
          localStorage.setItem(CURRENT_STORAGE_VERSION, JSON.stringify(seedData));
          setStateInternal(seedData);
        }
      } else {
        localStorage.setItem(CURRENT_STORAGE_VERSION, JSON.stringify(seedData));
      }

      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(legacyKey);
      }
    } catch {
      // Handle unavailable or blocked localStorage gracefully
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Live server sync effect: sync PostgreSQL / SQLite records on mount
  useEffect(() => {
    syncServerState();
  }, [syncServerState]);

  // Separate persistence effect: avoid performing side effects inside updater callbacks
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!isHydrated) return;

    try {
      localStorage.setItem(CURRENT_STORAGE_VERSION, JSON.stringify(state));
    } catch {
      // Ignore quota exceeded or storage unavailable errors
    }
  }, [state, isHydrated]);

  const setState = useCallback((updater: ((prev: DemoState) => DemoState) | DemoState) => {
    setStateInternal((prev) => (typeof updater === 'function' ? (updater as (prev: DemoState) => DemoState)(prev) : updater));
  }, []);

  const resetDemo = useCallback(() => {
    try {
      localStorage.removeItem(CURRENT_STORAGE_VERSION);
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(legacyKey);
      }
      localStorage.setItem(CURRENT_STORAGE_VERSION, JSON.stringify(seedData));
    } catch {
      // Ignore
    }
    setStateInternal(seedData);
  }, []);

  return (
    <DemoContext.Provider value={{ state, setState, resetDemo, isHydrated, syncFromServer: syncServerState }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    return {
      state: seedData,
      setState: () => {},
      resetDemo: () => {},
      isHydrated: false,
      syncFromServer: async () => {},
    };
  }
  return ctx;
}

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}
