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

const isProductionBuild = process.env.NODE_ENV === 'production';

function createEmptyPlatformState(): PlatformState {
  const defaultStorefront = platformSeedDefaults.storefront;
  const emptyBusiness: PlatformState['business'] = {
    businessName: '',
    legalName: '',
    email: '',
    phone: '',
    address: '',
    currency: 'USD',
    timezone: 'UTC',
    taxRate: 0,
    taxId: '',
    notificationPrefs: {
      newOrders: false,
      paymentReceived: false,
      ticketCreated: false,
      serviceSuspended: false,
      renewalReminders: false,
    },
    teamMembers: [],
    currentPlan: '',
  };
  const emptyStorefront: PlatformState['storefront'] = {
    ...defaultStorefront,
    businessName: '',
    tagline: '',
    description: '',
    email: '',
    phone: '',
    logoText: '',
    headline: '',
    displayedProductIds: [],
    showProductPricing: false,
    branding: {
      ...defaultStorefront.branding,
      businessName: '',
      legalName: '',
      tagline: '',
      email: '',
      phone: '',
      logoText: '',
      copyrightText: '',
    },
    header: {
      ...defaultStorefront.header,
      announcementBar: { ...defaultStorefront.header.announcementBar, enabled: false, text: '' },
      navItems: [],
      primaryCta: { ...defaultStorefront.header.primaryCta, visible: false },
      secondaryCta: { ...defaultStorefront.header.secondaryCta, visible: false },
    },
    footer: {
      ...defaultStorefront.footer,
      showContact: false,
      showSocials: false,
      socialLinks: [],
      columns: [],
    },
    seo: {
      ...defaultStorefront.seo,
      pageTitle: '',
      metaDescription: '',
      noIndex: true,
    },
    sections: [],
    pages: [],
    publishedAt: null,
    isDraftDirty: false,
  };

  return {
    ...platformSeedDefaults,
    customers: [],
    products: [],
    orders: [],
    services: [],
    domains: [],
    dnsZones: [],
    invoices: [],
    tickets: [],
    storefront: emptyStorefront,
    publishedStorefront: undefined,
    cart: [],
    activeClientCustomerId: null,
    integrations: [],
    business: emptyBusiness,
    notifications: [],
    platformOperator: {
      ...platformSeedDefaults.platformOperator,
      tenants: [],
      events: [],
      integrations: [],
    },
  };
}

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateInternal] = useState<PlatformState>(() =>
    isProductionBuild ? createEmptyPlatformState() : platformSeedDefaults
  );
  const [activeTenantId, setActiveTenantId] = useState(isProductionBuild ? '' : 'default');
  const [isHydrated, setIsHydrated] = useState(false);
  const isFirstRender = useRef(true);

  // Production state is sourced only from the authenticated server; seeded data is demo-only.
  const syncServerState = useCallback(async () => {
    try {
      let resolvedTenant = activeTenantId;
      if (isProductionBuild || !resolvedTenant) {
        const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!meRes.ok) {
          if (isProductionBuild) setStateInternal(createEmptyPlatformState());
          return;
        }
        const meData = await meRes.json();
        resolvedTenant = meData?.tenants?.[0]?.tenantId || '';
        if (!resolvedTenant) {
          if (isProductionBuild) setStateInternal(createEmptyPlatformState());
          return;
        }
        setActiveTenantId(resolvedTenant);
      }

      const res = await fetch(`/api/reseller/sync?tenantId=${encodeURIComponent(resolvedTenant)}`, { cache: 'no-store' });
      if (!res.ok) {
        if (isProductionBuild) setStateInternal(createEmptyPlatformState());
        return;
      }

      const d = await res.json();
      const requiredCollections = ['customers', 'products', 'orders', 'invoices', 'services', 'tickets', 'domains'];
      if (!d || requiredCollections.some((key) => !Array.isArray(d[key]))) {
        throw new Error('Server synchronization response is incomplete.');
      }

      setStateInternal((p) => {
        const next: PlatformState = { ...p };

        if (Array.isArray(d.customers)) {
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

        if (Array.isArray(d.products)) {
          next.products = d.products.map((pr: any) => ({
            id: pr.id,
            name: pr.name,
            type: pr.type,
            description: pr.description || '',
            pricing: Array.isArray(pr.pricing) ? pr.pricing : [],
            setupFee: Number(pr.setupFee || 0),
            resourceLimits: pr.resourceLimits ? (Array.isArray(pr.resourceLimits) ? pr.resourceLimits : Object.entries(pr.resourceLimits).map(([label, value]) => ({ label, value: String(value) }))) : [],
            available: pr.available ?? true,
            addons: pr.addons || [],
            capabilities: Array.isArray(pr.capabilities) ? pr.capabilities : [],
            planLimits: pr.planLimits || {},
          }));
        }

        if (Array.isArray(d.orders)) {
          next.orders = d.orders.map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerId: o.customerId,
            customerName: o.customer?.name || 'Customer',
            productId: o.productId || '',
            productName: o.product?.name || o.productName || 'Unknown product',
            status: o.status,
            amount: Number(o.amount),
            billingCycle: o.billingCycle || 'monthly',
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
            events: [],
          }));
        }

        if (Array.isArray(d.invoices)) {
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

        if (Array.isArray(d.services)) {
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
            nextRenewalDate: s.nextRenewalDate || '',
            billingCycle: s.billingCycle || 'monthly',
            price: Number(s.price),
            ipAddress: s.ipAddress || '',
            serverHostname: s.serverHostname || '',
            username: s.username || '',
            capabilities: Array.isArray(s.capabilities) ? s.capabilities : [],
            resourceUsage: Array.isArray(s.resourceUsage) ? s.resourceUsage : [],
            fileSystem: { files: [] },
            databases: [],
            databaseUsers: [],
            emailAccounts: [],
            emailForwarders: [],
            emailLogs: [],
            backups: [],
            logs: [],
            timeline: [],
          }));
        }

        if (Array.isArray(d.tickets)) {
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

        if (Array.isArray(d.domains)) {
          next.domains = d.domains.map((dom: any) => ({
            id: dom.id,
            domain: dom.domain,
            customerId: dom.customerId,
            customerName: dom.customerName || (next.customers.find((c) => c.id === dom.customerId)?.name) || 'Customer',
            registrar: dom.registrar || 'Unconfigured',
            status: dom.status,
            registeredDate: dom.registeredDate || '',
            expiryDate: dom.expiryDate || '',
            autoRenew: Boolean(dom.autoRenew),
            nameservers: Array.isArray(dom.nameservers) ? dom.nameservers : [],
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
      if (isProductionBuild) setStateInternal(createEmptyPlatformState());
    } finally {
      setIsHydrated(true);
    }
  }, [activeTenantId]);

  // Initial mount: synchronize with server
  useEffect(() => {
    syncServerState();
  }, [syncServerState]);

  const setState = useCallback((updater: ((prev: PlatformState) => PlatformState) | PlatformState) => {
    setStateInternal((prev) => (typeof updater === 'function' ? (updater as (prev: PlatformState) => PlatformState)(prev) : updater));
  }, []);

  const createCustomer = useCallback(async (data: { name: string; email: string; company?: string | null; country?: string; phone?: string | null }) => {
    const res = await fetch(`/api/reseller/customers?tenantId=${encodeURIComponent(activeTenantId)}`, {
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
  }, [activeTenantId, syncServerState]);

  const updateCustomer = useCallback(async (id: string, data: Partial<Customer>) => {
    const res = await fetch(`/api/reseller/customers/${id}?tenantId=${encodeURIComponent(activeTenantId)}`, {
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
  }, [activeTenantId, syncServerState]);

  const createProduct = useCallback(async (data: any) => {
    const res = await fetch(`/api/reseller/products?tenantId=${encodeURIComponent(activeTenantId)}`, {
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
  }, [activeTenantId, syncServerState]);

  const createOrder = useCallback(async (data: any) => {
    const res = await fetch(`/api/reseller/orders?tenantId=${encodeURIComponent(activeTenantId)}`, {
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
  }, [activeTenantId, syncServerState]);

  const createDomain = useCallback(async (data: any) => {
    const res = await fetch(`/api/reseller/domains?tenantId=${encodeURIComponent(activeTenantId)}`, {
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
  }, [activeTenantId, syncServerState]);

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
      state: isProductionBuild ? createEmptyPlatformState() : platformSeedDefaults,
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
