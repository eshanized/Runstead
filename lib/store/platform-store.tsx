'use client';

import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import type { PlatformState, Customer, Product, Order, Service, Domain, DnsZone, Invoice, Ticket } from '@/lib/types/platform';
import { platformSeedDefaults } from '@/lib/platform/seed-defaults';

export interface PlatformContextValue {
  state: PlatformState;
  setState: React.Dispatch<React.SetStateAction<PlatformState>>;
  isHydrated: boolean;
  syncFromServer: () => Promise<void>;
  createCustomer: (data: { name: string; email: string; company?: string | null; country?: string; phone?: string | null }) => Promise<any>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<any>;
  createProduct: (data: any) => Promise<any>;
  createOrder: (data: any) => Promise<any>;
  createDomain: (data: any) => Promise<any>;
  resetDemo?: () => void;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateInternal] = useState<PlatformState>(platformSeedDefaults);
  const [isHydrated, setIsHydrated] = useState(false);
  const isFirstRender = useRef(true);

  // Authoritative server synchronization with PostgreSQL / local SQLite
  const syncServerState = useCallback(async () => {
    try {
      const res = await fetch('/api/reseller/sync?tenantId=default');
      if (!res.ok) return;
      const d = await res.json();

      setStateInternal((p) => {
        const next: PlatformState = { ...p };

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
            totalRevenue: Number(c.totalRevenue || 0),
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
      // Offline fallback
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Initial mount: synchronize with server
  useEffect(() => {
    syncServerState();
  }, [syncServerState]);

  const setState = useCallback((updater: ((prev: PlatformState) => PlatformState) | PlatformState) => {
    setStateInternal((prev) => (typeof updater === 'function' ? (updater as (prev: PlatformState) => PlatformState)(prev) : updater));
  }, []);

  const createCustomer = useCallback(async (data: { name: string; email: string; company?: string | null; country?: string; phone?: string | null }) => {
    const res = await fetch('/api/reseller/customers?tenantId=default', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error || 'Failed to create customer');
    }
    await syncServerState();
    return resData.customer;
  }, [syncServerState]);

  const updateCustomer = useCallback(async (id: string, data: Partial<Customer>) => {
    const res = await fetch(`/api/reseller/customers/${id}?tenantId=default`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error || 'Failed to update customer');
    }
    await syncServerState();
    return resData.customer;
  }, [syncServerState]);

  const createProduct = useCallback(async (data: any) => {
    const res = await fetch('/api/reseller/products?tenantId=default', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error || 'Failed to create product');
    }
    await syncServerState();
    return resData.product;
  }, [syncServerState]);

  const createOrder = useCallback(async (data: any) => {
    const res = await fetch('/api/reseller/orders?tenantId=default', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error || 'Failed to create order');
    }
    await syncServerState();
    return resData.order;
  }, [syncServerState]);

  const createDomain = useCallback(async (data: any) => {
    const res = await fetch('/api/reseller/domains?tenantId=default', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error || 'Failed to register domain');
    }
    await syncServerState();
    return resData.domain;
  }, [syncServerState]);

  const resetDemo = useCallback(() => {
    syncServerState();
  }, [syncServerState]);

  return (
    <PlatformContext.Provider
      value={{
        state,
        setState,
        isHydrated,
        syncFromServer: syncServerState,
        createCustomer,
        updateCustomer,
        createProduct,
        createOrder,
        createDomain,
        resetDemo,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatformStore(): PlatformContextValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) {
    return {
      state: platformSeedDefaults,
      setState: () => {},
      isHydrated: false,
      syncFromServer: async () => {},
      createCustomer: async () => ({}),
      updateCustomer: async () => ({}),
      createProduct: async () => ({}),
      createOrder: async () => ({}),
      createDomain: async () => ({}),
      resetDemo: () => {},
    };
  }
  return ctx;
}

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

// Aliases for seamless migration and backwards compatibility
export const useDemo = usePlatformStore;
export const useResellerStore = usePlatformStore;
export const DemoProvider = PlatformProvider;
export const ResellerStoreProvider = PlatformProvider;
export const CURRENT_STORAGE_VERSION = 'runstead_platform_v1';
export function validateStoredDemoState(data: any) {
  return data;
}
