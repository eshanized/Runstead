'use client';

import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { z } from 'zod';
import type { DemoState } from './types';
import { seedData } from './seed-data';

import { migrateStorefrontConfig } from './storefront-presets';

export const CURRENT_STORAGE_VERSION = 'hostpilot_demo_v3';
export const LEGACY_STORAGE_KEYS = ['hostpilot_demo_v1', 'hostpilot_demo_v2'];

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
});

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
});

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
});

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
});

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
  setState: (updater: (prev: DemoState) => DemoState) => void;
  resetDemo: () => void;
  isHydrated: boolean;
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

  // Hydration effect: validate persisted storage safely
  useEffect(() => {
    try {
      const v2Stored = localStorage.getItem('hostpilot_demo_v2');
      const stored = localStorage.getItem(CURRENT_STORAGE_VERSION) || v2Stored;
      if (stored) {
        const parsed = JSON.parse(stored);
        const validated = validateStoredDemoState(parsed);
        if (validated) {
          setStateInternal(validated);
          localStorage.setItem(CURRENT_STORAGE_VERSION, JSON.stringify(validated));
        } else {
          // Corrupt or outdated schema — fallback to clean seed data
          localStorage.setItem(CURRENT_STORAGE_VERSION, JSON.stringify(seedData));
          setStateInternal(seedData);
        }
      } else {
        localStorage.setItem(CURRENT_STORAGE_VERSION, JSON.stringify(seedData));
      }

      // Clear legacy storage keys if present
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(legacyKey);
      }
    } catch {
      // Handle unavailable or blocked localStorage gracefully
    } finally {
      setIsHydrated(true);
    }
  }, []);


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

  const setState = useCallback((updater: (prev: DemoState) => DemoState) => {
    setStateInternal((prev) => updater(prev));
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
    <DemoContext.Provider value={{ state, setState, resetDemo, isHydrated }}>
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
    };
  }
  return ctx;
}

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}
