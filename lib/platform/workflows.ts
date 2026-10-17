import type {
  DemoState,
  Customer,
  Product,
  Order,
  OrderStatus,
  Service,
  ServiceStatus,
  Domain,
  DnsZone,
  DnsRecord,
  DnsRecordType,
  Invoice,
  InvoiceStatus,
  Ticket,
  TicketStatus,
  TicketPriority,
  StorefrontSettings,
  StorefrontConfig,
  CartItem,
  ThemePresetId,
  BusinessSettings,
  PlatformTenant,
  TenantStatus,
  BillingCycle,
  CapabilityId,
  PlanLimits,
  ServiceFile,
  ServiceFileSystem,
  ServiceDatabase,
  ServiceDatabaseUser,
  ServiceEmailAccount,
  ServiceEmailForwarder,
  ServiceSslCertificate,
  ServiceBackup,
  ServiceVpsData,
  ServiceDeveloperData,
} from '../types/platform.ts';
import { pricingPlans } from '../config/pricing.ts';
import { migrateStorefrontConfig, themePresets, defaultStorefrontConfig } from './storefront-presets.ts';
import {
  createDefaultFileSystem,
  createDefaultDatabases,
  createDefaultEmail,
  createDefaultSsl,
  createDefaultBackups,
  createDefaultVpsData,
  createDefaultDevData,
  createDefaultServiceLogs,
} from './service-factories.ts';
import {
  getDefaultCapabilitiesForProductType,
  isCapabilityAvailableForService,
} from './capabilities.ts';

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

export function createId(prefix: string): string {
  return generateId(prefix);
}

// -------------------------------------------------------------
// Validation Utilities
// -------------------------------------------------------------

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function normalizeHostname(host: string): string {
  return host.trim().toLowerCase().replace(/\.+$/, '');
}

export function isValidDomain(domain: string): { valid: boolean; error?: string } {
  const norm = normalizeHostname(domain);
  if (!norm) return { valid: false, error: 'Domain name cannot be empty.' };
  if (norm.length > 253) return { valid: false, error: 'Domain name exceeds maximum length of 253 characters.' };
  
  const parts = norm.split('.');
  if (parts.length < 2) return { valid: false, error: 'Domain must include a valid Top-Level Domain (e.g. .com, .io).' };

  for (const part of parts) {
    if (!part) return { valid: false, error: 'Domain labels cannot be empty.' };
    if (part.length > 63) return { valid: false, error: `Label "${part}" exceeds maximum length of 63 characters.` };
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(part)) {
      return { valid: false, error: `Label "${part}" contains invalid characters. Only alphanumeric and hyphens are allowed.` };
    }
  }

  const tld = parts[parts.length - 1];
  if (/^[0-9]+$/.test(tld)) {
    return { valid: false, error: 'TLD cannot be entirely numeric.' };
  }

  return { valid: true };
}

export function validateDnsRecord(
  type: DnsRecordType,
  host: string,
  value: string,
  priority: number | null
): { valid: boolean; error?: string } {
  const cleanHost = host.trim();
  const cleanVal = value.trim();

  if (!cleanHost) return { valid: false, error: 'Record host/name cannot be empty (@ for apex).' };
  if (!cleanVal) return { valid: false, error: 'Record value cannot be empty.' };

  switch (type) {
    case 'A': {
      // IPv4
      const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
      if (!ipv4Regex.test(cleanVal)) {
        return { valid: false, error: 'Invalid IPv4 address format (e.g. 192.0.2.1).' };
      }
      break;
    }
    case 'AAAA': {
      // IPv6
      const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|:([0-9a-fA-F]{1,4}:){1,7}|::)$/;
      if (!ipv6Regex.test(cleanVal) && !cleanVal.includes('::')) {
        return { valid: false, error: 'Invalid IPv6 address format (e.g. 2001:db8::1).' };
      }
      break;
    }
    case 'CNAME': {
      const domCheck = isValidDomain(cleanVal);
      if (!domCheck.valid) {
        return { valid: false, error: `CNAME target must be a valid domain: ${domCheck.error}` };
      }
      break;
    }
    case 'MX': {
      if (priority === null || isNaN(priority) || priority < 0 || priority > 65535) {
        return { valid: false, error: 'MX priority must be an integer between 0 and 65535.' };
      }
      const domCheck = isValidDomain(cleanVal);
      if (!domCheck.valid) {
        return { valid: false, error: `MX server target must be a valid domain: ${domCheck.error}` };
      }
      break;
    }
    case 'CAA': {
      if (!/^\d+\s+[a-z0-9]+\s+".*"$/.test(cleanVal)) {
        return { valid: false, error: 'CAA format should be: <flag> <tag> "<value>" (e.g. 0 issue "letsencrypt.org").' };
      }
      break;
    }
    case 'TXT': {
      if (cleanVal.length > 512) {
        return { valid: false, error: 'TXT record value exceeds standard max length of 512 characters in demo.' };
      }
      break;
    }
    default:
      break;
  }

  return { valid: true };
}

// -------------------------------------------------------------
// Customer Workflows
// -------------------------------------------------------------

export function createCustomer(
  state: DemoState,
  data: {
    name: string;
    email: string;
    company?: string | null;
    country?: string;
    phone?: string | null;
  }
): DemoState {
  if (!data.name.trim()) throw new Error('Customer name is required.');
  if (!isValidEmail(data.email)) throw new Error('A valid email address is required.');

  const existing = state.customers.find((c) => c.email.toLowerCase() === data.email.toLowerCase());
  if (existing) throw new Error(`A customer with email ${data.email} already exists.`);

  const id = createId('cust');
  const now = new Date().toISOString();

  const newCustomer: Customer = {
    id,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    company: data.company?.trim() || null,
    status: 'active',
    country: data.country?.trim() || 'United States',
    createdAt: now,
    phone: data.phone?.trim() || null,
    creditBalance: 0,
    servicesCount: 0,
    invoicesCount: 0,
    totalRevenue: 0,
    lastActivity: now,
    activity: [
      {
        id: createId('act'),
        type: 'customer_created',
        description: 'Customer account created in demo context',
        timestamp: now,
      },
    ],
  };

  return {
    ...state,
    customers: [newCustomer, ...state.customers],
  };
}

export function updateCustomer(
  state: DemoState,
  customerId: string,
  updates: Partial<Customer>
): DemoState {
  const customer = state.customers.find((c) => c.id === customerId);
  if (!customer) throw new Error(`Customer ${customerId} not found.`);

  if (updates.email && updates.email !== customer.email) {
    if (!isValidEmail(updates.email)) throw new Error('Invalid email address.');
    const duplicate = state.customers.find(
      (c) => c.id !== customerId && c.email.toLowerCase() === updates.email!.toLowerCase()
    );
    if (duplicate) throw new Error(`Email ${updates.email} is already in use by another customer.`);
  }

  const updatedCustomer: Customer = {
    ...customer,
    ...updates,
    activity: [
      ...customer.activity,
      {
        id: createId('act'),
        type: 'profile_updated',
        description: 'Profile updated',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  // If customer name updated, synchronize across orders, services, invoices, tickets
  const nameChanged = updates.name && updates.name !== customer.name;
  const newName = updates.name || customer.name;

  return {
    ...state,
    customers: state.customers.map((c) => (c.id === customerId ? updatedCustomer : c)),
    orders: nameChanged
      ? state.orders.map((o) => (o.customerId === customerId ? { ...o, customerName: newName } : o))
      : state.orders,
    services: nameChanged
      ? state.services.map((s) => (s.customerId === customerId ? { ...s, customerName: newName } : s))
      : state.services,
    invoices: nameChanged
      ? state.invoices.map((i) => (i.customerId === customerId ? { ...i, customerName: newName } : i))
      : state.invoices,
    tickets: nameChanged
      ? state.tickets.map((t) => (t.customerId === customerId ? { ...t, customerName: newName } : t))
      : state.tickets,
    domains: nameChanged
      ? state.domains.map((d) => (d.customerId === customerId ? { ...d, customerName: newName } : d))
      : state.domains,
  };
}

export function archiveCustomer(state: DemoState, customerId: string): DemoState {
  const customer = state.customers.find((c) => c.id === customerId);
  if (!customer) throw new Error(`Customer ${customerId} not found.`);

  return {
    ...state,
    customers: state.customers.map((c) =>
      c.id === customerId
        ? {
            ...c,
            status: 'inactive',
            archived: true,
            activity: [
              ...c.activity,
              {
                id: createId('act'),
                type: 'customer_archived',
                description: 'Customer archived safely without orphaning dependent records',
                timestamp: new Date().toISOString(),
              },
            ],
          }
        : c
    ),
  };
}

export function deleteCustomer(
  state: DemoState,
  customerId: string,
  options: { force?: boolean } = {}
): DemoState {
  const customer = state.customers.find((c) => c.id === customerId);
  if (!customer) throw new Error(`Customer ${customerId} not found.`);

  const hasActiveServices = state.services.some(
    (s) => s.customerId === customerId && (s.status === 'active' || s.status === 'pending')
  );
  const hasUnpaidInvoices = state.invoices.some(
    (i) => i.customerId === customerId && (i.status === 'sent' || i.status === 'overdue')
  );

  if (!options.force && (hasActiveServices || hasUnpaidInvoices)) {
    throw new Error(
      `Cannot delete customer with active services or unpaid invoices. Archive customer or cancel services first.`
    );
  }

  // If force deleting or safe to delete, also clean or preserve referential integrity
  return {
    ...state,
    customers: state.customers.filter((c) => c.id !== customerId),
  };
}

// -------------------------------------------------------------
// Product Workflows
// -------------------------------------------------------------

export function createProduct(
  state: DemoState,
  data: Omit<Product, 'id'>
): DemoState {
  if (!data.name.trim()) throw new Error('Product name is required.');
  if (!data.pricing || data.pricing.length === 0) throw new Error('Product must specify at least one billing price.');

  for (const priceItem of data.pricing) {
    if (priceItem.price < 0) throw new Error('Product price cannot be negative.');
  }

  const id = createId('prod');
  const newProduct: Product = {
    ...data,
    id,
    name: data.name.trim(),
  };

  return {
    ...state,
    products: [...state.products, newProduct],
  };
}

export function updateProduct(
  state: DemoState,
  productId: string,
  updates: Partial<Product>
): DemoState {
  const product = state.products.find((p) => p.id === productId);
  if (!product) throw new Error(`Product ${productId} not found.`);

  if (updates.pricing) {
    for (const pr of updates.pricing) {
      if (pr.price < 0) throw new Error('Pricing cannot be negative.');
    }
  }

  const updated: Product = { ...product, ...updates };

  return {
    ...state,
    products: state.products.map((p) => (p.id === productId ? updated : p)),
    // Sync product name to services if renamed
    services: updates.name
      ? state.services.map((s) => (s.productId === productId ? { ...s, productName: updates.name! } : s))
      : state.services,
  };
}

export function toggleProductAvailability(
  state: DemoState,
  productId: string,
  available: boolean
): DemoState {
  return updateProduct(state, productId, { available });
}

export function archiveProduct(state: DemoState, productId: string): DemoState {
  // Safe archive: set available to false and remove from storefront displayed products
  const product = state.products.find((p) => p.id === productId);
  if (!product) throw new Error(`Product ${productId} not found.`);

  return {
    ...state,
    products: state.products.map((p) => (p.id === productId ? { ...p, available: false } : p)),
    storefront: {
      ...state.storefront,
      displayedProductIds: state.storefront.displayedProductIds.filter((id) => id !== productId),
    },
  };
}

// -------------------------------------------------------------
// Order & Invoice Lifecycle Workflows
// -------------------------------------------------------------

export function calculateOrderPrice(
  product: Product,
  cycle: BillingCycle,
  taxRatePercent: number
): { unitPrice: number; subtotal: number; taxAmount: number; total: number } {
  const pricingEntry = product.pricing.find((pr) => pr.cycle === cycle) || product.pricing[0];
  const unitPrice = pricingEntry ? pricingEntry.price : 0;
  const subtotal = unitPrice + (product.setupFee || 0);
  const taxAmount = Math.round(((subtotal * taxRatePercent) / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return { unitPrice, subtotal, taxAmount, total };
}

export function createOrderWithInvoice(
  state: DemoState,
  params: {
    customerId: string;
    productId: string;
    billingCycle: BillingCycle;
    domainName?: string | null;
    simulatePaymentImmediately?: boolean;
    paymentMethod?: string;
  }
): { state: DemoState; order: Order; invoice: Invoice } {
  const customer = state.customers.find((c) => c.id === params.customerId);
  if (!customer) throw new Error(`Customer ${params.customerId} not found.`);

  const product = state.products.find((p) => p.id === params.productId);
  if (!product) throw new Error(`Product ${params.productId} not found.`);

  const { unitPrice, subtotal, taxAmount, total } = calculateOrderPrice(
    product,
    params.billingCycle,
    state.business.taxRate
  );

  const now = new Date().toISOString();
  const orderId = createId('ord');
  const invoiceId = createId('inv');
  const orderNum = `ORD-${String(state.orders.length + 155).padStart(4, '0')}`;
  const invoiceNum = `INV-${String(state.invoices.length + 55).padStart(4, '0')}`;

  const isPaid = Boolean(params.simulatePaymentImmediately);
  const orderStatus: OrderStatus = isPaid ? 'paid' : 'awaiting_payment';
  const invoiceStatus: InvoiceStatus = isPaid ? 'paid' : 'sent';

  const orderEvents = [
    {
      id: createId('evt'),
      status: 'awaiting_payment' as OrderStatus,
      description: `Order placed for ${product.name} (${params.billingCycle})`,
      timestamp: now,
    },
  ];

  if (isPaid) {
    orderEvents.push({
      id: createId('evt'),
      status: 'paid' as OrderStatus,
      description: `Payment confirmed via ${params.paymentMethod || 'Simulated Payment'}`,
      timestamp: now,
    });
  }

  const order: Order = {
    id: orderId,
    orderNumber: orderNum,
    customerId: customer.id,
    customerName: customer.name,
    productId: product.id,
    productName: product.name,
    status: orderStatus,
    amount: total,
    billingCycle: params.billingCycle,
    createdAt: now,
    updatedAt: now,
    events: orderEvents,
    invoiceId,
  };

  const invoiceDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const lineItems = [
    {
      id: createId('li'),
      description: `${product.name} — ${params.billingCycle.replace('_', ' ')}${params.domainName ? ` (${params.domainName})` : ''}`,
      quantity: 1,
      unitPrice,
      total: unitPrice,
    },
  ];

  if (product.setupFee > 0) {
    lineItems.push({
      id: createId('li'),
      description: `Setup Fee — ${product.name}`,
      quantity: 1,
      unitPrice: product.setupFee,
      total: product.setupFee,
    });
  }

  const invoice: Invoice = {
    id: invoiceId,
    invoiceNumber: invoiceNum,
    customerId: customer.id,
    customerName: customer.name,
    status: invoiceStatus,
    issueDate: now,
    dueDate: invoiceDueDate,
    paidDate: isPaid ? now : null,
    currency: state.business.currency || 'USD',
    lineItems,
    subtotal,
    taxRate: state.business.taxRate,
    taxAmount,
    total,
    payments: isPaid
      ? [
          {
            id: createId('pay'),
            method: params.paymentMethod || 'Credit Card (Simulated)',
            amount: total,
            date: now,
          },
        ]
      : [],
    orderId,
  };

  const updatedCustomer: Customer = {
    ...customer,
    invoicesCount: customer.invoicesCount + 1,
    totalRevenue: isPaid ? customer.totalRevenue + total : customer.totalRevenue,
    lastActivity: now,
    activity: [
      ...customer.activity,
      {
        id: createId('act'),
        type: 'order_placed',
        description: `Order ${orderNum} created for ${product.name}`,
        timestamp: now,
      },
    ],
  };

  const newNotification = {
    id: createId('notif'),
    title: 'New order received',
    description: `${orderNum} from ${customer.name} — ${product.name}`,
    read: false,
    timestamp: now,
    type: 'order',
  };

  const nextState: DemoState = {
    ...state,
    orders: [order, ...state.orders],
    invoices: [invoice, ...state.invoices],
    customers: state.customers.map((c) => (c.id === customer.id ? updatedCustomer : c)),
    notifications: [newNotification, ...state.notifications],
  };

  return { state: nextState, order, invoice };
}

// -------------------------------------------------------------
// Provisioning Simulation Workflows
// -------------------------------------------------------------

export function simulateProvisioning(
  state: DemoState,
  params: {
    orderId: string;
    domainName?: string | null;
    forceFailure?: boolean;
    failureReason?: string;
  }
): { state: DemoState; service?: Service; error?: string } {
  const order = state.orders.find((o) => o.id === params.orderId);
  if (!order) throw new Error(`Order ${params.orderId} not found.`);

  if (order.status !== 'paid' && order.status !== 'provisioning' && order.status !== 'failed') {
    if (order.status === 'active') {
      const existing = state.services.find((s) => s.orderId === order.id);
      return { state, service: existing };
    }
    throw new Error(`Cannot provision order with status "${order.status}". Order must be paid first.`);
  }

  const now = new Date().toISOString();

  if (params.forceFailure) {
    const reason = params.failureReason || 'Simulated failure: upstream cluster node exhausted capacity in region us-east-1';
    const failedOrder: Order = {
      ...order,
      status: 'failed',
      updatedAt: now,
      events: [
        ...order.events,
        {
          id: createId('evt'),
          status: 'failed',
          description: `Provisioning failed: ${reason}`,
          timestamp: now,
        },
      ],
    };

    const alertNotif = {
      id: createId('notif'),
      title: 'Provisioning failed',
      description: `${order.orderNumber} ${order.productName} — ${reason}`,
      read: false,
      timestamp: now,
      type: 'alert',
    };

    return {
      state: {
        ...state,
        orders: state.orders.map((o) => (o.id === order.id ? failedOrder : o)),
        notifications: [alertNotif, ...state.notifications],
      },
      error: reason,
    };
  }

  // Idempotency: check if service already exists for this order
  let existingService = state.services.find((s) => s.orderId === order.id);

  const product = state.products.find((p) => p.id === order.productId);
  const customer = state.customers.find((c) => c.id === order.customerId);

  const domain = params.domainName || `${order.customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}.runstead.tonmoyinfrastructure.org`;
  const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  let nextServices: Service[];
  let finalService: Service;

  if (existingService) {
    finalService = {
      ...existingService,
      status: 'active',
      provisioningError: null,
      timeline: [
        ...existingService.timeline,
        {
          id: createId('tl'),
          event: 'Provisioning retry succeeded',
          description: 'Control panel container deployed and verified active',
          timestamp: now,
        },
      ],
    };
    nextServices = state.services.map((s) => (s.id === existingService!.id ? finalService : s));
  } else {
    const serviceId = createId('srv');
    const ipAddress = '198.51.100.' + (Math.floor(Math.random() * 200) + 10);
    const username = 'u_' + Math.random().toString(36).substring(2, 7);
    const serverHostname = 'us-east-web01.runstead.tonmoyinfrastructure.org';
    const prodType = product?.type || 'shared_hosting';
    const caps = product?.capabilities || getDefaultCapabilitiesForProductType(prodType);

    finalService = {
      id: serviceId,
      serviceName: `${order.productName} (${domain})`,
      customerId: order.customerId,
      customerName: order.customerName,
      productId: order.productId,
      productName: order.productName,
      status: 'active',
      package: product?.name || 'Standard Hosting',
      domain,
      createdAt: now,
      nextRenewalDate: renewalDate,
      billingCycle: order.billingCycle,
      price: order.amount,
      resourceUsage: [
        { label: 'Storage', used: 1.2, total: product?.planLimits?.diskSpaceGB || 20, unit: 'GB' },
        { label: 'Bandwidth', used: 4.8, total: product?.planLimits?.bandwidthGB || 100, unit: 'GB' },
        { label: 'Databases', used: 1, total: product?.planLimits?.databases || 5, unit: 'DBs' },
      ],
      timeline: [
        {
          id: createId('tl'),
          event: 'Provisioning requested',
          description: `Automated provisioning started for order ${order.orderNumber}`,
          timestamp: now,
        },
        {
          id: createId('tl'),
          event: 'Container created',
          description: 'Node allocated on us-east cluster node 4',
          timestamp: now,
        },
        {
          id: createId('tl'),
          event: 'Service active',
          description: 'SSL certificate issued and nameservers verified',
          timestamp: now,
        },
      ],
      orderId: order.id,
      invoiceId: order.invoiceId,
      ipAddress,
      serverHostname,
      username,
      capabilities: caps,
      planLimits: product?.planLimits,
      fileSystem: createDefaultFileSystem(domain),
      ...createDefaultDatabases(domain, username),
      ...createDefaultEmail(domain, customer?.email || `admin@${domain}`),
      sslCertificate: createDefaultSsl(domain),
      backups: createDefaultBackups(domain),
      vpsData: prodType === 'vps' ? createDefaultVpsData(domain, ipAddress) : undefined,
      devData: createDefaultDevData(domain),
      logs: createDefaultServiceLogs(domain),
    };
    nextServices = [finalService, ...state.services];
  }

  const updatedOrder: Order = {
    ...order,
    status: 'active',
    updatedAt: now,
    serviceId: finalService.id,
    events: [
      ...order.events,
      {
        id: createId('evt'),
        status: 'active',
        description: `Service ${finalService.serviceName} provisioned successfully`,
        timestamp: now,
      },
    ],
  };

  const updatedCustomer = customer
    ? {
        ...customer,
        servicesCount: customer.servicesCount + (existingService ? 0 : 1),
        lastActivity: now,
        activity: [
          ...customer.activity,
          {
            id: createId('act'),
            type: 'service_provisioned',
            description: `Service ${finalService.serviceName} provisioned`,
            timestamp: now,
          },
        ],
      }
    : null;

  const successNotif = {
    id: createId('notif'),
    title: 'Service provisioned',
    description: `${order.productName} for ${order.customerName} is now active`,
    read: false,
    timestamp: now,
    type: 'service',
  };

  return {
    state: {
      ...state,
      orders: state.orders.map((o) => (o.id === order.id ? updatedOrder : o)),
      services: nextServices,
      customers: updatedCustomer
        ? state.customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
        : state.customers,
      notifications: [successNotif, ...state.notifications],
    },
    service: finalService,
  };
}

// -------------------------------------------------------------
// Service Lifecycle (Suspend, Restore, Cancel, Upgrade)
// -------------------------------------------------------------

export function suspendService(
  state: DemoState,
  params: { serviceId: string; reason?: string }
): DemoState {
  const service = state.services.find((s) => s.id === params.serviceId);
  if (!service) throw new Error(`Service ${params.serviceId} not found.`);
  if (service.status !== 'active') throw new Error(`Cannot suspend service in "${service.status}" state.`);

  const now = new Date().toISOString();
  const updatedService: Service = {
    ...service,
    status: 'suspended',
    timeline: [
      ...service.timeline,
      {
        id: createId('tl'),
        event: 'Service Suspended',
        description: params.reason || 'Suspended by administrator action (demo)',
        timestamp: now,
      },
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === service.id ? updatedService : s)),
  };
}

export function restoreService(
  state: DemoState,
  params: { serviceId: string }
): DemoState {
  const service = state.services.find((s) => s.id === params.serviceId);
  if (!service) throw new Error(`Service ${params.serviceId} not found.`);
  if (service.status !== 'suspended') throw new Error(`Cannot restore service in "${service.status}" state.`);

  const now = new Date().toISOString();
  const updatedService: Service = {
    ...service,
    status: 'active',
    timeline: [
      ...service.timeline,
      {
        id: createId('tl'),
        event: 'Service Restored',
        description: 'Restored to active status by administrator (demo)',
        timestamp: now,
      },
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === service.id ? updatedService : s)),
  };
}

export function cancelService(
  state: DemoState,
  params: { serviceId: string; reason?: string }
): DemoState {
  const service = state.services.find((s) => s.id === params.serviceId);
  if (!service) throw new Error(`Service ${params.serviceId} not found.`);

  const now = new Date().toISOString();
  const updatedService: Service = {
    ...service,
    status: 'canceled',
    timeline: [
      ...service.timeline,
      {
        id: createId('tl'),
        event: 'Service Canceled',
        description: params.reason || 'Service canceled (demo)',
        timestamp: now,
      },
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === service.id ? updatedService : s)),
  };
}

export function upgradeService(
  state: DemoState,
  params: { serviceId: string; newProductId: string; newPrice?: number }
): DemoState {
  const service = state.services.find((s) => s.id === params.serviceId);
  if (!service) throw new Error(`Service ${params.serviceId} not found.`);

  const newProduct = state.products.find((p) => p.id === params.newProductId);
  if (!newProduct) throw new Error(`Product ${params.newProductId} not found.`);

  const cyclePrice =
    params.newPrice ??
    newProduct.pricing.find((pr) => pr.cycle === service.billingCycle)?.price ??
    newProduct.pricing[0]?.price ??
    service.price;

  const now = new Date().toISOString();
  const updatedService: Service = {
    ...service,
    productId: newProduct.id,
    productName: newProduct.name,
    package: newProduct.name,
    price: cyclePrice,
    resourceUsage: newProduct.resourceLimits.map((rl) => {
      // Parse numeric limits or keep existing
      const valNum = parseInt(rl.value, 10) || 100;
      return {
        label: rl.label,
        used: Math.round(valNum * 0.2),
        total: valNum,
        unit: rl.value.replace(/^[0-9]+/, '').trim() || 'units',
      };
    }),
    timeline: [
      ...service.timeline,
      {
        id: createId('tl'),
        event: 'Service Upgraded',
        description: `Plan upgraded to ${newProduct.name} at $${cyclePrice}/${service.billingCycle}`,
        timestamp: now,
      },
    ],
  };

  const notification = {
    id: createId('notif'),
    title: 'Service Upgraded',
    description: `${service.domain || service.productName} upgraded to ${newProduct.name}.`,
    timestamp: now,
    read: false,
    type: 'info' as const,
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === service.id ? updatedService : s)),
    notifications: [notification, ...state.notifications],
  };
}

// -------------------------------------------------------------
// Invoice Operations (Mark Paid, Refund, Void)
// -------------------------------------------------------------

export function markInvoicePaid(
  state: DemoState,
  params: { invoiceId: string; method?: string }
): DemoState {
  const invoice = state.invoices.find((i) => i.id === params.invoiceId);
  if (!invoice) throw new Error(`Invoice ${params.invoiceId} not found.`);

  if (invoice.status === 'paid') return state; // idempotent
  if (invoice.status === 'void' || invoice.status === 'refunded') {
    throw new Error(`Cannot pay an invoice that is ${invoice.status}.`);
  }

  const now = new Date().toISOString();
  const paymentRecord = {
    id: createId('pay'),
    method: params.method || 'Credit Card (Simulated)',
    amount: invoice.total,
    date: now,
  };

  const updatedInvoice: Invoice = {
    ...invoice,
    status: 'paid',
    paidDate: now,
    payments: [...invoice.payments, paymentRecord],
  };

  // Update customer total revenue
  const customer = state.customers.find((c) => c.id === invoice.customerId);
  const updatedCustomers = customer
    ? state.customers.map((c) =>
        c.id === customer.id
          ? {
              ...c,
              totalRevenue: c.totalRevenue + invoice.total,
              lastActivity: now,
              activity: [
                ...c.activity,
                {
                  id: createId('act'),
                  type: 'invoice_paid',
                  description: `Invoice ${invoice.invoiceNumber} paid (${invoice.currency} ${invoice.total})`,
                  timestamp: now,
                },
              ],
            }
          : c
      )
    : state.customers;

  // If invoice is linked to an order that is awaiting_payment, advance order to paid
  const updatedOrders = state.orders.map((o) => {
    if (o.invoiceId === invoice.id && o.status === 'awaiting_payment') {
      return {
        ...o,
        status: 'paid' as OrderStatus,
        updatedAt: now,
        events: [
          ...o.events,
          {
            id: createId('evt'),
            status: 'paid' as OrderStatus,
            description: `Payment received for ${invoice.invoiceNumber}`,
            timestamp: now,
          },
        ],
      };
    }
    return o;
  });

  return {
    ...state,
    invoices: state.invoices.map((i) => (i.id === invoice.id ? updatedInvoice : i)),
    customers: updatedCustomers,
    orders: updatedOrders,
  };
}

export function voidInvoice(
  state: DemoState,
  params: { invoiceId: string; reason?: string }
): DemoState {
  const invoice = state.invoices.find((i) => i.id === params.invoiceId);
  if (!invoice) throw new Error(`Invoice ${params.invoiceId} not found.`);
  if (invoice.status === 'paid') throw new Error('Cannot void a paid invoice. Use refund instead.');

  const updatedInvoice: Invoice = {
    ...invoice,
    status: 'void',
  };

  return {
    ...state,
    invoices: state.invoices.map((i) => (i.id === invoice.id ? updatedInvoice : i)),
  };
}

export function refundInvoice(
  state: DemoState,
  params: { invoiceId: string; reason?: string }
): DemoState {
  const invoice = state.invoices.find((i) => i.id === params.invoiceId);
  if (!invoice) throw new Error(`Invoice ${params.invoiceId} not found.`);
  if (invoice.status !== 'paid') throw new Error('Only paid invoices can be refunded.');

  const now = new Date().toISOString();
  const updatedInvoice: Invoice = {
    ...invoice,
    status: 'refunded',
  };

  const customer = state.customers.find((c) => c.id === invoice.customerId);
  const updatedCustomers = customer
    ? state.customers.map((c) =>
        c.id === customer.id
          ? {
              ...c,
              totalRevenue: Math.max(0, c.totalRevenue - invoice.total),
              lastActivity: now,
              activity: [
                ...c.activity,
                {
                  id: createId('act'),
                  type: 'invoice_refunded',
                  description: `Refund processed for ${invoice.invoiceNumber} (${params.reason || 'Requested by customer'})`,
                  timestamp: now,
                },
              ],
            }
          : c
      )
    : state.customers;

  return {
    ...state,
    invoices: state.invoices.map((i) => (i.id === invoice.id ? updatedInvoice : i)),
    customers: updatedCustomers,
  };
}

// -------------------------------------------------------------
// Domain & DNS Workflows
// -------------------------------------------------------------

export function connectExternalDomain(
  state: DemoState,
  params: {
    customerId: string;
    domain: string;
    nameservers?: string[];
  }
): DemoState {
  const check = isValidDomain(params.domain);
  if (!check.valid) throw new Error(check.error);

  const normDomain = normalizeHostname(params.domain);
  const existing = state.domains.find((d) => normalizeHostname(d.domain) === normDomain);
  if (existing) throw new Error(`Domain ${normDomain} is already connected or registered.`);

  const customer = state.customers.find((c) => c.id === params.customerId);
  if (!customer) throw new Error(`Customer ${params.customerId} not found.`);

  const domainId = createId('dom');
  const zoneId = createId('zone');
  const now = new Date().toISOString();

  const nameservers = params.nameservers || ['ns1.external-dns.com', 'ns2.external-dns.com'];

  const newDomain: Domain = {
    id: domainId,
    domain: normDomain,
    customerId: customer.id,
    customerName: customer.name,
    registrar: 'External (connected)',
    status: 'active',
    registeredDate: now,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    autoRenew: false,
    nameservers,
    dnsZoneId: zoneId,
    domainType: 'external',
  };

  // Create corresponding DNS zone
  const newZone: DnsZone = {
    id: zoneId,
    domain: normDomain,
    records: [
      { id: createId('rec'), zoneId, type: 'A', host: '@', value: '198.51.100.1', ttl: 3600, priority: null },
      { id: createId('rec'), zoneId, type: 'CNAME', host: 'www', value: normDomain, ttl: 3600, priority: null },
    ],
  };

  return {
    ...state,
    domains: [newDomain, ...state.domains],
    dnsZones: [...state.dnsZones, newZone],
  };
}

export function purchaseDomainSimulation(
  state: DemoState,
  params: {
    customerId: string;
    domain: string;
    price?: number;
    autoRenew?: boolean;
    simulatePayment?: boolean;
  }
): { state: DemoState; domain: Domain; invoice: Invoice } {
  const check = isValidDomain(params.domain);
  if (!check.valid) throw new Error(check.error);

  const normDomain = normalizeHostname(params.domain);
  const existing = state.domains.find((d) => normalizeHostname(d.domain) === normDomain);
  if (existing) throw new Error(`Domain ${normDomain} is already registered.`);

  const customer = state.customers.find((c) => c.id === params.customerId);
  if (!customer) throw new Error(`Customer ${params.customerId} not found.`);

  const price = params.price ?? 14.99;
  const now = new Date().toISOString();
  const domainId = createId('dom');
  const zoneId = createId('zone');
  const orderId = createId('ord');
  const invoiceId = createId('inv');

  const isPaid = params.simulatePayment ?? true;
  const orderNum = `ORD-${String(state.orders.length + 155).padStart(4, '0')}`;
  const invoiceNum = `INV-${String(state.invoices.length + 55).padStart(4, '0')}`;

  const taxAmount = Math.round(((price * state.business.taxRate) / 100) * 100) / 100;
  const total = Math.round((price + taxAmount) * 100) / 100;

  const order: Order = {
    id: orderId,
    orderNumber: orderNum,
    customerId: customer.id,
    customerName: customer.name,
    productId: 'prod_005',
    productName: 'Domain Registration',
    status: isPaid ? 'active' : 'awaiting_payment',
    amount: total,
    billingCycle: 'annually',
    createdAt: now,
    updatedAt: now,
    events: [
      { id: createId('evt'), status: 'awaiting_payment', description: `Domain registration order for ${normDomain}`, timestamp: now },
      ...(isPaid ? [{ id: createId('evt'), status: 'paid' as OrderStatus, description: 'Simulated payment confirmed', timestamp: now }] : []),
      ...(isPaid ? [{ id: createId('evt'), status: 'active' as OrderStatus, description: 'Domain registered and DNS zone created', timestamp: now }] : []),
    ],
    invoiceId,
    domainId,
  };

  const invoice: Invoice = {
    id: invoiceId,
    invoiceNumber: invoiceNum,
    customerId: customer.id,
    customerName: customer.name,
    status: isPaid ? 'paid' : 'sent',
    issueDate: now,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    paidDate: isPaid ? now : null,
    currency: state.business.currency || 'USD',
    lineItems: [
      {
        id: createId('li'),
        description: `Domain Registration — ${normDomain} (1 Year)`,
        quantity: 1,
        unitPrice: price,
        total: price,
      },
    ],
    subtotal: price,
    taxRate: state.business.taxRate,
    taxAmount,
    total,
    payments: isPaid ? [{ id: createId('pay'), method: 'Credit Card (Simulated)', amount: total, date: now }] : [],
    orderId,
  };

  const newDomain: Domain = {
    id: domainId,
    domain: normDomain,
    customerId: customer.id,
    customerName: customer.name,
    registrar: 'ResellerClub (simulated)',
    status: 'active',
    registeredDate: now,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    autoRenew: params.autoRenew ?? true,
    nameservers: ['ns1.runstead.tonmoyinfrastructure.org', 'ns2.runstead.tonmoyinfrastructure.org'],
    dnsZoneId: zoneId,
    domainType: 'registered',
    price,
    invoiceId,
  };

  const newZone: DnsZone = {
    id: zoneId,
    domain: normDomain,
    records: [
      { id: createId('rec'), zoneId, type: 'A', host: '@', value: '198.51.100.25', ttl: 3600, priority: null },
      { id: createId('rec'), zoneId, type: 'CNAME', host: 'www', value: normDomain, ttl: 3600, priority: null },
      { id: createId('rec'), zoneId, type: 'MX', host: '@', value: 'mail.' + normDomain, ttl: 3600, priority: 10 },
      { id: createId('rec'), zoneId, type: 'TXT', host: '@', value: 'v=spf1 include:_spf.runstead.tonmoyinfrastructure.org ~all', ttl: 3600, priority: null },
    ],
  };

  const updatedCustomer: Customer = {
    ...customer,
    invoicesCount: customer.invoicesCount + 1,
    totalRevenue: isPaid ? customer.totalRevenue + total : customer.totalRevenue,
    lastActivity: now,
    activity: [
      ...customer.activity,
      {
        id: createId('act'),
        type: 'domain_registered',
        description: `Registered domain ${normDomain}`,
        timestamp: now,
      },
    ],
  };

  return {
    state: {
      ...state,
      domains: [newDomain, ...state.domains],
      dnsZones: [...state.dnsZones, newZone],
      orders: [order, ...state.orders],
      invoices: [invoice, ...state.invoices],
      customers: state.customers.map((c) => (c.id === customer.id ? updatedCustomer : c)),
    },
    domain: newDomain,
    invoice,
  };
}

export function renewDomain(
  state: DemoState,
  params: { domainId: string; years?: number }
): DemoState {
  const domain = state.domains.find((d) => d.id === params.domainId);
  if (!domain) throw new Error(`Domain ${params.domainId} not found.`);

  const years = params.years ?? 1;
  const currentExpiry = new Date(domain.expiryDate);
  const renewedExpiry = new Date(currentExpiry);
  renewedExpiry.setFullYear(renewedExpiry.getFullYear() + years);

  const updatedDomain: Domain = {
    ...domain,
    expiryDate: renewedExpiry.toISOString(),
  };

  return {
    ...state,
    domains: state.domains.map((d) => (d.id === domain.id ? updatedDomain : d)),
  };
}

export function deleteDomain(
  state: DemoState,
  domainId: string
): DemoState {
  const domain = state.domains.find((d) => d.id === domainId);
  if (!domain) throw new Error(`Domain ${domainId} not found.`);

  // Clean domain and associated DNS zone if zone exists
  return {
    ...state,
    domains: state.domains.filter((d) => d.id !== domainId),
    dnsZones: domain.dnsZoneId
      ? state.dnsZones.filter((z) => z.id !== domain.dnsZoneId)
      : state.dnsZones,
  };
}

// -------------------------------------------------------------
// DNS Record Mutations
// -------------------------------------------------------------

export function addDnsRecord(
  state: DemoState,
  params: {
    zoneId: string;
    type: DnsRecordType;
    host: string;
    value: string;
    ttl: number;
    priority: number | null;
  }
): DemoState {
  const zone = state.dnsZones.find((z) => z.id === params.zoneId);
  if (!zone) throw new Error(`DNS Zone ${params.zoneId} not found.`);

  const validation = validateDnsRecord(params.type, params.host, params.value, params.priority);
  if (!validation.valid) throw new Error(validation.error);

  const newRecord: DnsRecord = {
    id: createId('rec'),
    zoneId: params.zoneId,
    type: params.type,
    host: params.host.trim(),
    value: params.value.trim(),
    ttl: params.ttl || 3600,
    priority: params.type === 'MX' ? params.priority : null,
  };

  return {
    ...state,
    dnsZones: state.dnsZones.map((z) =>
      z.id === params.zoneId ? { ...z, records: [...z.records, newRecord] } : z
    ),
  };
}

export function updateDnsRecord(
  state: DemoState,
  params: {
    zoneId: string;
    recordId: string;
    updates: Partial<Omit<DnsRecord, 'id' | 'zoneId'>>;
  }
): DemoState {
  const zone = state.dnsZones.find((z) => z.id === params.zoneId);
  if (!zone) throw new Error(`DNS Zone ${params.zoneId} not found.`);

  const existing = zone.records.find((r) => r.id === params.recordId);
  if (!existing) throw new Error(`DNS Record ${params.recordId} not found in zone.`);

  const nextType = params.updates.type || existing.type;
  const nextHost = params.updates.host ?? existing.host;
  const nextValue = params.updates.value ?? existing.value;
  const nextPriority = params.updates.priority !== undefined ? params.updates.priority : existing.priority;

  const validation = validateDnsRecord(nextType, nextHost, nextValue, nextPriority);
  if (!validation.valid) throw new Error(validation.error);

  const updatedRecord: DnsRecord = {
    ...existing,
    ...params.updates,
    type: nextType,
    host: nextHost.trim(),
    value: nextValue.trim(),
    priority: nextType === 'MX' ? nextPriority : null,
  };

  return {
    ...state,
    dnsZones: state.dnsZones.map((z) =>
      z.id === params.zoneId
        ? {
            ...z,
            records: z.records.map((r) => (r.id === params.recordId ? updatedRecord : r)),
          }
        : z
    ),
  };
}

export function deleteDnsRecord(
  state: DemoState,
  params: { zoneId: string; recordId: string }
): DemoState {
  const zone = state.dnsZones.find((z) => z.id === params.zoneId);
  if (!zone) throw new Error(`DNS Zone ${params.zoneId} not found.`);

  return {
    ...state,
    dnsZones: state.dnsZones.map((z) =>
      z.id === params.zoneId
        ? { ...z, records: z.records.filter((r) => r.id !== params.recordId) }
        : z
    ),
  };
}

// -------------------------------------------------------------
// Ticket Workflows
// -------------------------------------------------------------

export function createTicket(
  state: DemoState,
  params: {
    customerId: string;
    subject: string;
    priority: TicketPriority;
    category: string;
    message: string;
    assignedTo?: string | null;
  }
): DemoState {
  const customer = state.customers.find((c) => c.id === params.customerId);
  if (!customer) throw new Error(`Customer ${params.customerId} not found.`);

  if (!params.subject.trim()) throw new Error('Ticket subject is required.');
  if (!params.message.trim()) throw new Error('Initial message cannot be empty.');

  const now = new Date().toISOString();
  const ticketId = createId('tkt');
  const ticketNumber = `TKT-${String(state.tickets.length + 25).padStart(4, '0')}`;

  const newTicket: Ticket = {
    id: ticketId,
    ticketNumber,
    subject: params.subject.trim(),
    customerId: customer.id,
    customerName: customer.name,
    status: 'open',
    priority: params.priority,
    assignedTo: params.assignedTo || null,
    createdAt: now,
    updatedAt: now,
    category: params.category || 'Technical Support',
    messages: [
      {
        id: createId('msg'),
        author: customer.name,
        authorType: 'customer',
        message: params.message.trim(),
        timestamp: now,
        internal: false,
      },
    ],
  };

  const updatedCustomer: Customer = {
    ...customer,
    lastActivity: now,
    activity: [
      ...customer.activity,
      {
        id: createId('act'),
        type: 'ticket_created',
        description: `Created ticket ${ticketNumber}: ${params.subject}`,
        timestamp: now,
      },
    ],
  };

  return {
    ...state,
    tickets: [newTicket, ...state.tickets],
    customers: state.customers.map((c) => (c.id === customer.id ? updatedCustomer : c)),
  };
}

export function addTicketMessage(
  state: DemoState,
  params: {
    ticketId: string;
    author: string;
    authorType: 'customer' | 'staff';
    message: string;
    internal?: boolean;
    updateStatusTo?: TicketStatus;
  }
): DemoState {
  const ticket = state.tickets.find((t) => t.id === params.ticketId);
  if (!ticket) throw new Error(`Ticket ${params.ticketId} not found.`);
  if (!params.message.trim()) throw new Error('Message cannot be empty.');

  const now = new Date().toISOString();
  const newMsg = {
    id: createId('msg'),
    author: params.author.trim(),
    authorType: params.authorType,
    message: params.message.trim(),
    timestamp: now,
    internal: Boolean(params.internal),
  };

  let nextStatus = ticket.status;
  if (params.updateStatusTo) {
    nextStatus = params.updateStatusTo;
  } else if (params.authorType === 'customer' && ticket.status === 'resolved') {
    nextStatus = 'open'; // Customer reply reopens ticket
  } else if (params.authorType === 'staff' && !params.internal && ticket.status === 'open') {
    nextStatus = 'in_progress';
  }

  const updatedTicket: Ticket = {
    ...ticket,
    status: nextStatus,
    updatedAt: now,
    messages: [...ticket.messages, newMsg],
  };

  return {
    ...state,
    tickets: state.tickets.map((t) => (t.id === ticket.id ? updatedTicket : t)),
  };
}

export function updateTicketStatus(
  state: DemoState,
  params: { ticketId: string; status: TicketStatus; assignedTo?: string | null }
): DemoState {
  const ticket = state.tickets.find((t) => t.id === params.ticketId);
  if (!ticket) throw new Error(`Ticket ${params.ticketId} not found.`);

  const updatedTicket: Ticket = {
    ...ticket,
    status: params.status,
    assignedTo: params.assignedTo !== undefined ? params.assignedTo : ticket.assignedTo,
    updatedAt: new Date().toISOString(),
  };

  return {
    ...state,
    tickets: state.tickets.map((t) => (t.id === ticket.id ? updatedTicket : t)),
  };
}

// -------------------------------------------------------------
// SaaS Acquisition & Tenant Launch Journey Workflows
// -------------------------------------------------------------

export function launchSaaSTenant(
  state: DemoState,
  params: {
    planName: string;
    billingInterval: 'monthly' | 'annually';
    businessName: string;
    category: string;
    email: string;
    phone?: string;
    primaryColor?: string;
    accentColor?: string;
    headline?: string;
    logoText?: string;
    customPrices?: Record<string, number>;
  }
): DemoState {
  if (!params.businessName.trim()) throw new Error('Business name is required.');
  if (!params.email.trim() || !isValidEmail(params.email)) throw new Error('Valid contact email is required.');

  const planDef = pricingPlans.find((p) => p.name.toLowerCase() === params.planName.toLowerCase()) || pricingPlans[1];
  const mrr = params.billingInterval === 'annually' ? (planDef.annualPrice ?? 0) : (planDef.monthlyPrice ?? 0);

  const cleanName = params.businessName.trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const now = new Date().toISOString();

  // 1. Update reseller business settings
  const nextBusiness: BusinessSettings = {
    ...state.business,
    businessName: cleanName,
    legalName: `${cleanName} LLC`,
    email: params.email.trim(),
    phone: params.phone?.trim() || state.business.phone,
    currentPlan: planDef.name,
    category: params.category,
  };

  // 2. Update storefront settings
  const primaryColor = params.primaryColor || '#0f5fff';
  const accentColor = params.accentColor || '#00c896';
  const logoText = params.logoText || cleanName.slice(0, 2).toUpperCase();
  const headline = params.headline || 'Host smarter. Scale faster.';

  const nextStorefront: StorefrontConfig = migrateStorefrontConfig({
    ...state.storefront,
    businessName: cleanName,
    email: params.email.trim(),
    phone: params.phone?.trim() || state.storefront.phone,
    primaryColor,
    accentColor,
    logoText,
    headline,
    branding: {
      ...state.storefront.branding,
      businessName: cleanName,
      logoText,
      email: params.email.trim(),
      phone: params.phone?.trim() || state.storefront.branding?.phone || '',
    },
    theme: {
      ...state.storefront.theme,
      primaryColor,
      accentColor,
    },
  });

  // 3. Update products with custom prices if provided
  let nextProducts = state.products;
  if (params.customPrices && Object.keys(params.customPrices).length > 0) {
    nextProducts = state.products.map((p) => {
      if (params.customPrices && params.customPrices[p.id] !== undefined) {
        const newPrice = params.customPrices[p.id];
        return {
          ...p,
          pricing: p.pricing.map((pr) => (pr.cycle === 'monthly' ? { ...pr, price: newPrice } : pr)),
        };
      }
      return p;
    });
  }

  // 4. Update / create platform operator tenant record
  const existingTenant = state.platformOperator.tenants.find((t) => t.id === 'ten_001');
  const updatedTenant: PlatformTenant = {
    id: existingTenant ? existingTenant.id : createId('ten'),
    businessName: cleanName,
    slug,
    category: params.category,
    plan: planDef.name,
    status: 'active',
    billingInterval: params.billingInterval,
    mrr,
    customerCount: state.customers.length,
    customerLimit: planDef.limits.find((l) => l.label === 'Customers')?.value === 'Unlimited' ? 'Unlimited' : parseInt(planDef.limits.find((l) => l.label === 'Customers')?.value || '500', 10),
    serviceCount: state.services.length,
    onboardingCompleted: true,
    createdAt: existingTenant ? existingTenant.createdAt : now,
    lastActiveAt: now,
    contactEmail: params.email.trim(),
    customDomain: `portal.${slug}.host`,
  };

  const newOperatorEvent = {
    id: createId('p_evt'),
    tenantId: updatedTenant.id,
    tenantName: cleanName,
    type: 'tenant_launched',
    description: `Tenant ${cleanName} subscribed to ${planDef.name} tier (${params.billingInterval})`,
    timestamp: now,
    severity: 'info' as const,
  };

  return {
    ...state,
    business: nextBusiness,
    storefront: nextStorefront,
    publishedStorefront: nextStorefront,
    products: nextProducts,
    platformOperator: {
      ...state.platformOperator,
      tenants: [updatedTenant, ...state.platformOperator.tenants.filter((t) => t.id !== 'ten_001')],
      events: [newOperatorEvent, ...state.platformOperator.events],
    },
  };

}

// -------------------------------------------------------------
// Platform Operator Console Workflows
// -------------------------------------------------------------

export function updatePlatformTenantStatus(
  state: DemoState,
  params: { tenantId: string; status: TenantStatus }
): DemoState {
  const tenant = state.platformOperator.tenants.find((t) => t.id === params.tenantId);
  if (!tenant) throw new Error(`Platform tenant ${params.tenantId} not found.`);

  const now = new Date().toISOString();
  const updatedTenant: PlatformTenant = {
    ...tenant,
    status: params.status,
    lastActiveAt: now,
  };

  const event = {
    id: createId('p_evt'),
    tenantId: tenant.id,
    tenantName: tenant.businessName,
    type: params.status === 'suspended' ? 'tenant_suspended' : 'tenant_activated',
    description: `Tenant status changed to ${params.status}`,
    timestamp: now,
    severity: params.status === 'suspended' ? ('warning' as const) : ('info' as const),
  };

  return {
    ...state,
    platformOperator: {
      ...state.platformOperator,
      tenants: state.platformOperator.tenants.map((t) => (t.id === tenant.id ? updatedTenant : t)),
      events: [event, ...state.platformOperator.events],
    },
  };
}

export function updatePlatformTenantPlan(
  state: DemoState,
  params: { tenantId: string; plan: string; billingInterval?: 'monthly' | 'annually' }
): DemoState {
  const tenant = state.platformOperator.tenants.find((t) => t.id === params.tenantId);
  if (!tenant) throw new Error(`Platform tenant ${params.tenantId} not found.`);

  const planDef = pricingPlans.find((p) => p.name.toLowerCase() === params.plan.toLowerCase());
  const interval = params.billingInterval || tenant.billingInterval;
  const mrr = planDef ? (interval === 'annually' ? (planDef.annualPrice ?? 0) : (planDef.monthlyPrice ?? 0)) : tenant.mrr;

  const now = new Date().toISOString();
  const updatedTenant: PlatformTenant = {
    ...tenant,
    plan: planDef ? planDef.name : params.plan,
    billingInterval: interval,
    mrr,
    lastActiveAt: now,
  };

  const event = {
    id: createId('p_evt'),
    tenantId: tenant.id,
    tenantName: tenant.businessName,
    type: 'plan_upgraded',
    description: `Tenant plan updated to ${updatedTenant.plan} (${interval})`,
    timestamp: now,
    severity: 'info' as const,
  };

  // If this is the active demo business tenant, also update local business settings
  const nextBusiness = tenant.id === 'ten_001'
    ? { ...state.business, currentPlan: updatedTenant.plan }
    : state.business;

  return {
    ...state,
    business: nextBusiness,
    platformOperator: {
      ...state.platformOperator,
      tenants: state.platformOperator.tenants.map((t) => (t.id === tenant.id ? updatedTenant : t)),
      events: [event, ...state.platformOperator.events],
    },
  };
}

// -------------------------------------------------------------
// Cart & Multi-Item Checkout Workflows
// -------------------------------------------------------------

export function calculateCartTotals(
  cart: CartItem[] = [],
  taxRatePercent: number = 0
): { subtotal: number; taxAmount: number; total: number; itemCount: number } {
  const subtotal = cart.reduce((acc, item) => {
    const addonsTotal = (item.selectedAddons || []).reduce((aSum, a) => aSum + a.price, 0);
    return acc + (item.unitPrice * item.quantity) + (item.setupFee || 0) + (addonsTotal * item.quantity);
  }, 0);

  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const taxAmount = Math.round(((roundedSubtotal * taxRatePercent) / 100) * 100) / 100;
  const total = Math.round((roundedSubtotal + taxAmount) * 100) / 100;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return { subtotal: roundedSubtotal, taxAmount, total, itemCount };
}

export function addToCart(
  state: DemoState,
  item: Omit<CartItem, 'id'>
): DemoState {
  const product = state.products.find((p) => p.id === item.productId);
  if (!product) throw new Error(`Product ${item.productId} not found.`);

  // Validate supported billing cycle
  const pricingEntry = product.pricing.find((pr) => pr.cycle === item.billingCycle);
  if (!pricingEntry) {
    throw new Error(`Product ${product.name} does not support billing cycle "${item.billingCycle}".`);
  }

  const id = createId('cart');
  const cartItem: CartItem = {
    ...item,
    id,
    unitPrice: pricingEntry.price,
    setupFee: product.setupFee || 0,
    quantity: Math.max(1, item.quantity || 1),
    selectedAddons: item.selectedAddons || [],
  };

  const currentCart = Array.isArray(state.cart) ? state.cart : [];
  return {
    ...state,
    cart: [...currentCart, cartItem],
  };
}

export function removeFromCart(state: DemoState, cartItemId: string): DemoState {
  const currentCart = Array.isArray(state.cart) ? state.cart : [];
  return {
    ...state,
    cart: currentCart.filter((item) => item.id !== cartItemId),
  };
}

export function updateCartItemCycle(
  state: DemoState,
  cartItemId: string,
  cycle: BillingCycle
): DemoState {
  const currentCart = Array.isArray(state.cart) ? state.cart : [];
  const item = currentCart.find((i) => i.id === cartItemId);
  if (!item) return state;

  const product = state.products.find((p) => p.id === item.productId);
  if (!product) return state;

  const pricingEntry = product.pricing.find((pr) => pr.cycle === cycle);
  if (!pricingEntry) {
    throw new Error(`Product ${product.name} does not support billing cycle "${cycle}".`);
  }

  return {
    ...state,
    cart: currentCart.map((i) =>
      i.id === cartItemId
        ? {
            ...i,
            billingCycle: cycle,
            unitPrice: pricingEntry.price,
          }
        : i
    ),
  };
}

export function updateCartItemQuantity(
  state: DemoState,
  cartItemId: string,
  quantity: number
): DemoState {
  const currentCart = Array.isArray(state.cart) ? state.cart : [];
  if (quantity <= 0) {
    return removeFromCart(state, cartItemId);
  }
  return {
    ...state,
    cart: currentCart.map((i) => (i.id === cartItemId ? { ...i, quantity } : i)),
  };
}

export function clearCart(state: DemoState): DemoState {
  return {
    ...state,
    cart: [],
  };
}

export function checkoutCart(
  state: DemoState,
  params: {
    customerId: string;
    paymentMethod?: string;
  }
): {
  state: DemoState;
  orders: Order[];
  invoice: Invoice;
  services: Service[];
  domains: Domain[];
} {
  const customer = state.customers.find((c) => c.id === params.customerId);
  if (!customer) throw new Error(`Customer ${params.customerId} not found.`);

  const cart = Array.isArray(state.cart) ? state.cart : [];
  if (cart.length === 0) throw new Error('Cannot checkout with an empty cart.');

  const now = new Date().toISOString();
  const invoiceId = createId('inv');
  const invoiceNum = `INV-${String(state.invoices.length + 55).padStart(4, '0')}`;
  const paymentMethod = params.paymentMethod || 'Simulated Payment';

  const orders: Order[] = [];
  const services: Service[] = [];
  const domains: Domain[] = [];
  const lineItems: any[] = [];
  let invoiceSubtotal = 0;

  let currentServices = [...state.services];
  let currentDomains = [...state.domains];
  let currentDnsZones = [...state.dnsZones];

  for (let idx = 0; idx < cart.length; idx++) {
    const item = cart[idx];
    const product = state.products.find((p) => p.id === item.productId);
    if (!product) continue;

    const orderId = createId('ord');
    const orderNum = `ORD-${String(state.orders.length + orders.length + 155).padStart(4, '0')}`;
    const itemAddonsTotal = (item.selectedAddons || []).reduce((sum, a) => sum + a.price, 0);
    const itemSubtotal = (item.unitPrice * item.quantity) + (item.setupFee || 0) + (itemAddonsTotal * item.quantity);
    invoiceSubtotal += itemSubtotal;

    // Line item for the main product
    lineItems.push({
      id: createId('li'),
      description: `${product.name} (${item.billingCycle.replace('_', ' ')})${item.domainName ? ` — ${item.domainName}` : ''}`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.unitPrice * item.quantity,
    });

    if (item.setupFee > 0) {
      lineItems.push({
        id: createId('li'),
        description: `${product.name} — Setup Fee`,
        quantity: 1,
        unitPrice: item.setupFee,
        total: item.setupFee,
      });
    }

    for (const addon of item.selectedAddons || []) {
      lineItems.push({
        id: createId('li'),
        description: `${product.name} Add-on: ${addon.name}`,
        quantity: item.quantity,
        unitPrice: addon.price,
        total: addon.price * item.quantity,
      });
    }

    let serviceId: string | undefined;
    let domainId: string | undefined;

    // Provision service if hosting/vps/managed
    if (['shared_hosting', 'vps', 'managed_service', 'dns_management'].includes(product.type)) {
      serviceId = createId('srv');
      const ipOctet = 50 + (currentServices.length % 200);
      const isVps = product.type === 'vps';
      const renewalDays = item.billingCycle === 'annually' ? 365 : item.billingCycle === 'quarterly' ? 90 : 30;
      const nextRenewalDate = new Date(Date.now() + renewalDays * 24 * 60 * 60 * 1000).toISOString();

      const newService: Service = {
        id: serviceId,
        serviceName: `${product.name} - ${item.domainName || `${customer.name.split(' ')[0].toLowerCase()}-app`}`,
        customerId: customer.id,
        customerName: customer.name,
        productId: product.id,
        productName: product.name,
        status: 'active',
        package: product.name,
        domain: item.domainName || null,
        createdAt: now,
        nextRenewalDate,
        billingCycle: item.billingCycle,
        price: item.unitPrice,
        resourceUsage: isVps
          ? [
              { label: 'CPU', used: 12, total: 100, unit: '%' },
              { label: 'RAM', used: 1.2, total: 4, unit: 'GB' },
              { label: 'Disk', used: 8.5, total: 80, unit: 'GB' },
              { label: 'Bandwidth', used: 45, total: 2000, unit: 'GB' },
            ]
          : [
              { label: 'Disk', used: 0.8, total: 10, unit: 'GB' },
              { label: 'Bandwidth', used: 5.2, total: 100, unit: 'GB' },
            ],
        timeline: [
          {
            id: createId('tl'),
            event: 'provisioned',
            description: `Automated service container provisioned from cart order ${orderNum}`,
            timestamp: now,
          },
        ],
        orderId,
        invoiceId,
        ipAddress: `198.51.100.${ipOctet}`,
        serverHostname: isVps ? `vps-${serviceId.slice(-4)}.runstead.tonmoyinfrastructure.org` : `node1.runstead.tonmoyinfrastructure.org`,
        username: customer.email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8),
      };

      services.push(newService);
      currentServices.push(newService);
    }

    // Register domain if domain product or linked domain
    if (product.type === 'domain_registration' || item.domainName) {
      const domName = item.domainName || `${customer.name.split(' ')[0].toLowerCase()}-cloud.com`;
      domainId = createId('dom');
      const dnsZoneId = createId('zone');

      const newDomain: Domain = {
        id: domainId,
        domain: domName.toLowerCase(),
        customerId: customer.id,
        customerName: customer.name,
        registrar: 'ResellerClub (Simulated)',
        status: 'active',
        registeredDate: now,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
        nameservers: ['ns1.cloudvista.host', 'ns2.cloudvista.host'],
        dnsZoneId,
        domainType: 'registered',
        price: item.unitPrice,
        invoiceId,
      };

      domains.push(newDomain);
      currentDomains.push(newDomain);

      // Create DNS zone
      currentDnsZones.push({
        id: dnsZoneId,
        domain: domName.toLowerCase(),
        records: [
          { id: createId('rec'), zoneId: dnsZoneId, type: 'A', host: '@', value: '198.51.100.50', ttl: 3600, priority: null },
          { id: createId('rec'), zoneId: dnsZoneId, type: 'CNAME', host: 'www', value: domName.toLowerCase(), ttl: 3600, priority: null },
          { id: createId('rec'), zoneId: dnsZoneId, type: 'MX', host: '@', value: `mail.${domName.toLowerCase()}`, ttl: 3600, priority: 10 },
        ],
      });
    }

    const order: Order = {
      id: orderId,
      orderNumber: orderNum,
      customerId: customer.id,
      customerName: customer.name,
      productId: product.id,
      productName: product.name,
      status: 'active',
      amount: itemSubtotal,
      billingCycle: item.billingCycle,
      createdAt: now,
      updatedAt: now,
      events: [
        { id: createId('evt'), status: 'paid', description: `Cart order placed and paid via ${paymentMethod}`, timestamp: now },
        { id: createId('evt'), status: 'active', description: `Automated service provisioned successfully`, timestamp: now },
      ],
      invoiceId,
      serviceId,
      domainId,
    };

    orders.push(order);
  }

  const taxAmount = Math.round(((invoiceSubtotal * state.business.taxRate) / 100) * 100) / 100;
  const invoiceTotal = Math.round((invoiceSubtotal + taxAmount) * 100) / 100;

  const invoice: Invoice = {
    id: invoiceId,
    invoiceNumber: invoiceNum,
    customerId: customer.id,
    customerName: customer.name,
    status: 'paid',
    issueDate: now,
    dueDate: now,
    paidDate: now,
    currency: state.business.currency || 'USD',
    lineItems,
    subtotal: invoiceSubtotal,
    taxRate: state.business.taxRate,
    taxAmount,
    total: invoiceTotal,
    payments: [
      {
        id: createId('pmt'),
        method: paymentMethod,
        amount: invoiceTotal,
        date: now,
      },
    ],
  };

  // Update customer record
  const updatedCustomer: Customer = {
    ...customer,
    servicesCount: customer.servicesCount + services.length,
    invoicesCount: customer.invoicesCount + 1,
    totalRevenue: customer.totalRevenue + invoiceTotal,
    lastActivity: now,
    activity: [
      ...customer.activity,
      {
        id: createId('act'),
        type: 'checkout_completed',
        description: `Order ${invoiceNum} confirmed for ${cart.length} item(s) via ${paymentMethod}`,
        timestamp: now,
      },
    ],
  };

  const nextState: DemoState = {
    ...state,
    cart: [], // Clear cart
    orders: [...state.orders, ...orders],
    invoices: [...state.invoices, invoice],
    services: currentServices,
    domains: currentDomains,
    dnsZones: currentDnsZones,
    customers: state.customers.map((c) => (c.id === customer.id ? updatedCustomer : c)),
  };

  return {
    state: nextState,
    orders,
    invoice,
    services,
    domains,
  };
}

// -------------------------------------------------------------
// Customer Portal Workflows
// -------------------------------------------------------------

export function clientOpenTicket(
  state: DemoState,
  params: {
    customerId: string;
    subject: string;
    message: string;
    category?: string;
    priority?: TicketPriority;
  }
): { state: DemoState; ticket: Ticket } {
  const customer = state.customers.find((c) => c.id === params.customerId);
  if (!customer) throw new Error(`Customer ${params.customerId} not found.`);
  if (!params.subject.trim()) throw new Error('Ticket subject is required.');
  if (!params.message.trim()) throw new Error('Ticket message is required.');

  const now = new Date().toISOString();
  const ticketId = createId('tkt');
  const ticketNum = `TKT-${String(state.tickets.length + 26).padStart(4, '0')}`;

  const ticket: Ticket = {
    id: ticketId,
    ticketNumber: ticketNum,
    subject: params.subject.trim(),
    customerId: customer.id,
    customerName: customer.name,
    status: 'open',
    priority: params.priority || 'medium',
    assignedTo: 'Tier 1 Support',
    createdAt: now,
    updatedAt: now,
    category: params.category || 'Technical Support',
    messages: [
      {
        id: createId('msg'),
        author: customer.name,
        authorType: 'customer',
        message: params.message.trim(),
        timestamp: now,
      },
    ],
  };

  const updatedCustomer: Customer = {
    ...customer,
    lastActivity: now,
    activity: [
      ...customer.activity,
      {
        id: createId('act'),
        type: 'ticket_created',
        description: `Opened ticket ${ticketNum}: ${params.subject.trim()}`,
        timestamp: now,
      },
    ],
  };

  return {
    state: {
      ...state,
      tickets: [ticket, ...state.tickets],
      customers: state.customers.map((c) => (c.id === customer.id ? updatedCustomer : c)),
    },
    ticket,
  };
}

export function clientReplyTicket(
  state: DemoState,
  ticketId: string,
  customerId: string,
  message: string
): DemoState {
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) throw new Error(`Ticket ${ticketId} not found.`);
  if (ticket.customerId !== customerId) throw new Error('Unauthorized ticket reply.');
  if (!message.trim()) throw new Error('Reply message cannot be empty.');

  const customer = state.customers.find((c) => c.id === customerId);
  const now = new Date().toISOString();

  const updatedTicket: Ticket = {
    ...ticket,
    status: 'in_progress',
    updatedAt: now,
    messages: [
      ...ticket.messages,
      {
        id: createId('msg'),
        author: customer ? customer.name : 'Customer',
        authorType: 'customer',
        message: message.trim(),
        timestamp: now,
      },
    ],
  };

  return {
    ...state,
    tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
  };
}

export function clientPayInvoice(
  state: DemoState,
  invoiceId: string,
  customerId: string,
  paymentMethod: string = 'Credit Card (Simulated)'
): DemoState {
  const invoice = state.invoices.find((i) => i.id === invoiceId);
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found.`);
  if (invoice.customerId !== customerId) throw new Error('Unauthorized invoice access.');
  if (invoice.status === 'paid') return state;

  return markInvoicePaid(state, { invoiceId, method: paymentMethod });
}

export function clientUpdateProfile(
  state: DemoState,
  customerId: string,
  updates: { name?: string; phone?: string; company?: string }
): DemoState {
  const customer = state.customers.find((c) => c.id === customerId);
  if (!customer) throw new Error(`Customer ${customerId} not found.`);

  const updatedCustomer: Customer = {
    ...customer,
    name: updates.name ? updates.name.trim() : customer.name,
    phone: updates.phone !== undefined ? updates.phone.trim() : customer.phone,
    company: updates.company !== undefined ? updates.company.trim() : customer.company,
    lastActivity: new Date().toISOString(),
  };

  return {
    ...state,
    customers: state.customers.map((c) => (c.id === customerId ? updatedCustomer : c)),
  };
}

// -------------------------------------------------------------
// Storefront Draft / Publish Workflows
// -------------------------------------------------------------

export function saveStorefrontDraft(state: DemoState, draft: StorefrontConfig): DemoState {
  return {
    ...state,
    storefront: {
      ...draft,
      isDraftDirty: true,
    },
  };
}

export function publishStorefrontDraft(state: DemoState): DemoState {
  const now = new Date().toISOString();
  const publishedConfig: StorefrontConfig = {
    ...state.storefront,
    publishedAt: now,
    isDraftDirty: false,
  };

  return {
    ...state,
    storefront: publishedConfig,
    publishedStorefront: publishedConfig,
  };
}

export function revertStorefrontDraft(state: DemoState): DemoState {
  const target = state.publishedStorefront || state.storefront;
  return {
    ...state,
    storefront: {
      ...target,
      isDraftDirty: false,
    },
  };
}

export function resetStorefrontToPreset(
  state: DemoState,
  presetId: ThemePresetId
): DemoState {
  const preset = themePresets[presetId];
  if (!preset) return state;

  return {
    ...state,
    storefront: {
      ...state.storefront,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      theme: {
        ...preset,
      },
      isDraftDirty: true,
    },
  };
}

export function resetStorefrontToDefaults(state: DemoState): DemoState {
  return {
    ...state,
    storefront: {
      ...defaultStorefrontConfig,
      isDraftDirty: true,
    },
  };
}

// -------------------------------------------------------------
// Hosting Control Center Workflows
// -------------------------------------------------------------

export function createServiceFile(
  state: DemoState,
  serviceId: string,
  file: { path: string; name: string; isDir: boolean; content?: string }
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const fs = service.fileSystem || createDefaultFileSystem(service.domain || 'example.com');
  const cleanPath = file.path.startsWith('/') ? file.path : '/' + file.path;

  if (fs.files.some((f) => f.path === cleanPath)) {
    throw new Error(`File or directory "${cleanPath}" already exists.`);
  }

  const now = new Date().toISOString();
  const newFile: ServiceFile = {
    path: cleanPath,
    name: file.name,
    isDir: file.isDir,
    size: file.isDir ? 4096 : (file.content ? file.content.length : 0),
    modifiedAt: now,
    permissions: file.isDir ? '0755' : '0644',
    content: file.isDir ? undefined : (file.content || ''),
  };

  const updatedService: Service = {
    ...service,
    fileSystem: {
      files: [...fs.files, newFile],
    },
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'web',
        message: `${file.isDir ? 'Directory' : 'File'} created: ${cleanPath}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function updateServiceFileContent(
  state: DemoState,
  serviceId: string,
  filePath: string,
  content: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const fs = service.fileSystem || createDefaultFileSystem(service.domain || 'example.com');
  const target = fs.files.find((f) => f.path === filePath);
  if (!target) throw new Error(`File "${filePath}" not found in filesystem.`);
  if (target.isDir) throw new Error(`Cannot save content to a directory.`);

  const now = new Date().toISOString();
  const updatedFiles = fs.files.map((f) => {
    if (f.path === filePath) {
      return {
        ...f,
        content,
        size: content.length,
        modifiedAt: now,
      };
    }
    return f;
  });

  const updatedService: Service = {
    ...service,
    fileSystem: { files: updatedFiles },
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'web',
        message: `File saved: ${filePath} (${content.length} bytes)`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function deleteServiceFile(
  state: DemoState,
  serviceId: string,
  filePath: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const fs = service.fileSystem || createDefaultFileSystem(service.domain || 'example.com');
  if (filePath === '/' || filePath === '/public_html') {
    throw new Error(`Cannot delete protected system directory "${filePath}".`);
  }

  const now = new Date().toISOString();
  const updatedFiles = fs.files.filter((f) => f.path !== filePath && !f.path.startsWith(filePath + '/'));

  const updatedService: Service = {
    ...service,
    fileSystem: { files: updatedFiles },
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'web',
        message: `Deleted file/folder: ${filePath}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function renameServiceFile(
  state: DemoState,
  serviceId: string,
  oldPath: string,
  newName: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const fs = service.fileSystem || createDefaultFileSystem(service.domain || 'example.com');
  const target = fs.files.find((f) => f.path === oldPath);
  if (!target) throw new Error(`File "${oldPath}" not found.`);

  const parent = oldPath.substring(0, oldPath.lastIndexOf('/')) || '';
  const newPath = (parent ? `${parent}/${newName}` : `/${newName}`).replace(/\/+/g, '/');

  if (fs.files.some((f) => f.path === newPath)) {
    throw new Error(`A file or folder named "${newName}" already exists in this directory.`);
  }

  const now = new Date().toISOString();
  const updatedFiles = fs.files.map((f) => {
    if (f.path === oldPath) {
      return { ...f, path: newPath, name: newName, modifiedAt: now };
    }
    if (f.path.startsWith(oldPath + '/')) {
      const childSub = f.path.substring(oldPath.length);
      return { ...f, path: `${newPath}${childSub}`, modifiedAt: now };
    }
    return f;
  });

  const updatedService: Service = {
    ...service,
    fileSystem: { files: updatedFiles },
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'web',
        message: `Renamed ${oldPath} to ${newPath}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

// Database Workflows
export function createServiceDatabase(
  state: DemoState,
  serviceId: string,
  name: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!cleanName) throw new Error('Database name must contain alphanumeric characters.');

  const existingDbs = service.databases || [];
  const maxDbs = service.planLimits?.databases || 5;
  if (existingDbs.length >= maxDbs) {
    throw new Error(`Database limit reached (${existingDbs.length}/${maxDbs}). Upgrade plan to add more.`);
  }

  if (existingDbs.some((db) => db.name.toLowerCase() === cleanName.toLowerCase())) {
    throw new Error(`Database "${cleanName}" already exists.`);
  }

  const now = new Date().toISOString();
  const newDb: ServiceDatabase = {
    id: createId('db'),
    name: cleanName,
    sizeMB: 0.1,
    collation: 'utf8mb4_unicode_ci',
    charset: 'utf8mb4',
    users: [],
    tables: [],
    createdAt: now,
  };

  const updatedService: Service = {
    ...service,
    databases: [...existingDbs, newDb],
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'database',
        message: `Database created: ${cleanName}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function deleteServiceDatabase(
  state: DemoState,
  serviceId: string,
  dbId: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const existingDbs = service.databases || [];
  const target = existingDbs.find((d) => d.id === dbId);
  if (!target) throw new Error(`Database not found.`);

  const now = new Date().toISOString();
  const updatedService: Service = {
    ...service,
    databases: existingDbs.filter((d) => d.id !== dbId),
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'database',
        message: `Database dropped: ${target.name}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function createServiceDatabaseUser(
  state: DemoState,
  serviceId: string,
  username: string,
  privileges: string[] = ['ALL PRIVILEGES']
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!cleanUser) throw new Error('Database username cannot be empty.');

  const existingUsers = service.databaseUsers || [];
  if (existingUsers.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase())) {
    throw new Error(`Database user "${cleanUser}" already exists.`);
  }

  const now = new Date().toISOString();
  const newUser: ServiceDatabaseUser = {
    id: createId('dbu'),
    username: cleanUser,
    host: 'localhost',
    privileges: privileges.length > 0 ? privileges : ['ALL PRIVILEGES'],
  };

  const updatedService: Service = {
    ...service,
    databaseUsers: [...existingUsers, newUser],
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'database',
        message: `Database user created: ${cleanUser}@localhost`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function deleteServiceDatabaseUser(
  state: DemoState,
  serviceId: string,
  userId: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const existingUsers = service.databaseUsers || [];
  const target = existingUsers.find((u) => u.id === userId);
  if (!target) throw new Error(`Database user not found.`);

  const now = new Date().toISOString();
  const updatedService: Service = {
    ...service,
    databaseUsers: existingUsers.filter((u) => u.id !== userId),
    databases: (service.databases || []).map((db) => ({
      ...db,
      users: db.users.filter((u) => u !== target.username),
    })),
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'database',
        message: `Database user deleted: ${target.username}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

// Email Workflows
export function createServiceEmailAccount(
  state: DemoState,
  serviceId: string,
  address: string,
  quotaMB: number
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const cleanAddr = address.trim().toLowerCase();
  if (!cleanAddr.includes('@')) throw new Error('Invalid email address.');

  const existingAccounts = service.emailAccounts || [];
  const maxAccounts = service.planLimits?.emailAccounts || 5;
  if (existingAccounts.length >= maxAccounts) {
    throw new Error(`Email account limit reached (${existingAccounts.length}/${maxAccounts}). Upgrade plan to add more mailboxes.`);
  }

  if (existingAccounts.some((a) => a.address.toLowerCase() === cleanAddr)) {
    throw new Error(`Email account "${cleanAddr}" already exists.`);
  }

  const now = new Date().toISOString();
  const newAccount: ServiceEmailAccount = {
    id: createId('em'),
    address: cleanAddr,
    quotaMB: quotaMB || 1024,
    usedMB: 0,
    status: 'active',
    createdAt: now,
  };

  const updatedService: Service = {
    ...service,
    emailAccounts: [...existingAccounts, newAccount],
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'mail',
        message: `Mailbox provisioned: ${cleanAddr} (Quota: ${quotaMB || 1024} MB)`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function deleteServiceEmailAccount(
  state: DemoState,
  serviceId: string,
  accountId: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const existing = service.emailAccounts || [];
  const target = existing.find((a) => a.id === accountId);
  if (!target) throw new Error(`Email account not found.`);

  const now = new Date().toISOString();
  const updatedService: Service = {
    ...service,
    emailAccounts: existing.filter((a) => a.id !== accountId),
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'mail',
        message: `Mailbox deleted: ${target.address}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function createServiceEmailForwarder(
  state: DemoState,
  serviceId: string,
  source: string,
  destination: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const cleanSrc = source.trim().toLowerCase();
  const cleanDst = destination.trim().toLowerCase();

  if (!cleanSrc.includes('@') || !cleanDst.includes('@')) {
    throw new Error('Both source and destination must be valid email addresses.');
  }

  const existing = service.emailForwarders || [];
  if (existing.some((f) => f.source === cleanSrc && f.destination === cleanDst)) {
    throw new Error(`Forwarder from ${cleanSrc} to ${cleanDst} already exists.`);
  }

  const now = new Date().toISOString();
  const newFwd: ServiceEmailForwarder = {
    id: createId('ef'),
    source: cleanSrc,
    destination: cleanDst,
    createdAt: now,
  };

  const updatedService: Service = {
    ...service,
    emailForwarders: [...existing, newFwd],
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'mail',
        message: `Email forwarder configured: ${cleanSrc} -> ${cleanDst}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function deleteServiceEmailForwarder(
  state: DemoState,
  serviceId: string,
  forwarderId: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const existing = service.emailForwarders || [];
  const target = existing.find((f) => f.id === forwarderId);
  if (!target) throw new Error('Forwarder not found.');

  const now = new Date().toISOString();
  const updatedService: Service = {
    ...service,
    emailForwarders: existing.filter((f) => f.id !== forwarderId),
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'mail',
        message: `Email forwarder deleted: ${target.source} -> ${target.destination}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

// SSL Workflows
export function renewServiceSslCertificate(
  state: DemoState,
  serviceId: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const now = new Date();
  const nowIso = now.toISOString();
  const expiryDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const domain = service.domain || 'example.com';

  const updatedSsl: ServiceSslCertificate = {
    status: 'active',
    issuer: "Let's Encrypt Authority X3",
    coveredDomains: [domain, `www.${domain}`],
    issueDate: nowIso,
    expiryDate,
    autoRenew: true,
    forceHttps: service.sslCertificate?.forceHttps ?? true,
    hsts: service.sslCertificate?.hsts ?? true,
    minTlsVersion: service.sslCertificate?.minTlsVersion ?? '1.3',
    lastOperationLog: 'Certificate successfully verified and issued via simulated ACME challenge.',
  };

  const updatedService: Service = {
    ...service,
    sslCertificate: updatedSsl,
    timeline: [
      {
        id: createId('tl'),
        event: 'SSL Certificate Renewed',
        description: `New certificate issued by Let's Encrypt, valid until ${expiryDate.slice(0, 10)}`,
        timestamp: nowIso,
      },
      ...service.timeline,
    ],
    logs: [
      {
        id: createId('lg'),
        timestamp: nowIso,
        severity: 'info',
        category: 'web',
        message: `TLS certificate renewed successfully for ${domain}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function toggleServiceHttpsRedirect(
  state: DemoState,
  serviceId: string,
  forceHttps: boolean
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const now = new Date().toISOString();
  const ssl = service.sslCertificate || createDefaultSsl(service.domain || 'example.com');
  const updatedSsl: ServiceSslCertificate = { ...ssl, forceHttps };

  const updatedService: Service = {
    ...service,
    sslCertificate: updatedSsl,
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'web',
        message: `HTTP to HTTPS automatic redirect ${forceHttps ? 'enabled' : 'disabled'}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

// Backup Workflows
export function createServiceBackup(
  state: DemoState,
  serviceId: string,
  scope: 'full' | 'database' | 'files' = 'full'
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const domain = service.domain || 'service';
  const now = new Date();
  const nowIso = now.toISOString();
  const dateStr = now.toISOString().slice(0, 10);
  const size = scope === 'full' ? 342 : scope === 'database' ? 38 : 304;

  const newBackup: ServiceBackup = {
    id: createId('bk'),
    filename: `backup-${domain}-${scope}-${dateStr}.tar.gz`,
    sizeMB: size,
    type: 'manual',
    scope,
    status: 'completed',
    createdAt: nowIso,
    retentionDays: 30,
  };

  const updatedService: Service = {
    ...service,
    backups: [newBackup, ...(service.backups || [])],
    timeline: [
      {
        id: createId('tl'),
        event: 'Manual Backup Created',
        description: `Snapshot ${newBackup.filename} (${size} MB) stored`,
        timestamp: nowIso,
      },
      ...service.timeline,
    ],
    logs: [
      {
        id: createId('lg'),
        timestamp: nowIso,
        severity: 'info',
        category: 'system',
        message: `Backup ${newBackup.filename} created successfully`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function restoreServiceBackup(
  state: DemoState,
  serviceId: string,
  backupId: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const target = (service.backups || []).find((b) => b.id === backupId);
  if (!target) throw new Error(`Backup not found.`);

  const now = new Date().toISOString();
  const updatedService: Service = {
    ...service,
    timeline: [
      {
        id: createId('tl'),
        event: 'Backup Restored',
        description: `Restored service snapshot ${target.filename}`,
        timestamp: now,
      },
      ...service.timeline,
    ],
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'system',
        message: `Restore point ${target.filename} applied to active service environment`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function deleteServiceBackup(
  state: DemoState,
  serviceId: string,
  backupId: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const now = new Date().toISOString();
  const updatedService: Service = {
    ...service,
    backups: (service.backups || []).filter((b) => b.id !== backupId),
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'system',
        message: `Backup snapshot deleted`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

// VPS Compute Workflows
export function setServiceVpsPowerState(
  state: DemoState,
  serviceId: string,
  powerState: 'running' | 'stopped' | 'restarting'
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const vps = service.vpsData || createDefaultVpsData(service.domain || 'vps.host', service.ipAddress || '198.51.100.80');
  const now = new Date().toISOString();

  const updatedVps: ServiceVpsData = {
    ...vps,
    powerState,
    uptimeSeconds: powerState === 'running' ? (vps.powerState === 'running' ? vps.uptimeSeconds : 60) : 0,
  };

  const updatedService: Service = {
    ...service,
    vpsData: updatedVps,
    timeline: [
      {
        id: createId('tl'),
        event: `Server ${powerState.toUpperCase()}`,
        description: `Hypervisor state transition executed: ${powerState}`,
        timestamp: now,
      },
      ...service.timeline,
    ],
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: powerState === 'stopped' ? 'warning' : 'info',
        category: 'system',
        message: `Virtual machine power state changed to: ${powerState}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function addServiceVpsSshKey(
  state: DemoState,
  serviceId: string,
  name: string,
  publicKey: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const cleanKey = publicKey.trim();
  if (!cleanKey.startsWith('ssh-rsa') && !cleanKey.startsWith('ssh-ed25519')) {
    throw new Error('Invalid public key format. Must begin with ssh-rsa or ssh-ed25519.');
  }

  const vps = service.vpsData || createDefaultVpsData(service.domain || 'vps.host', service.ipAddress || '198.51.100.80');
  const now = new Date().toISOString();

  const newKey = {
    id: createId('ssh'),
    name: name.trim() || 'Workstation Key',
    publicKey: cleanKey,
    createdAt: now,
  };

  const updatedService: Service = {
    ...service,
    vpsData: {
      ...vps,
      sshKeys: [...vps.sshKeys, newKey],
    },
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'auth',
        message: `Authorized SSH public key registered: "${newKey.name}"`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function deleteServiceVpsSshKey(
  state: DemoState,
  serviceId: string,
  keyId: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const vps = service.vpsData || createDefaultVpsData(service.domain || 'vps.host', service.ipAddress || '198.51.100.80');
  const now = new Date().toISOString();

  const updatedService: Service = {
    ...service,
    vpsData: {
      ...vps,
      sshKeys: vps.sshKeys.filter((k) => k.id !== keyId),
    },
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'auth',
        message: `Authorized SSH public key removed`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function addServiceVpsFirewallRule(
  state: DemoState,
  serviceId: string,
  rule: {
    portRange: string;
    protocol: 'TCP' | 'UDP' | 'TCP/UDP';
    source: string;
    action: 'ALLOW' | 'DENY';
    description: string;
  }
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const vps = service.vpsData || createDefaultVpsData(service.domain || 'vps.host', service.ipAddress || '198.51.100.80');
  const now = new Date().toISOString();

  const newRule = {
    id: createId('fr'),
    ...rule,
  };

  const updatedService: Service = {
    ...service,
    vpsData: {
      ...vps,
      firewallRules: [...vps.firewallRules, newRule],
    },
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'system',
        message: `Firewall filter rule added: ${rule.action} ${rule.protocol} port ${rule.portRange} from ${rule.source}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function deleteServiceVpsFirewallRule(
  state: DemoState,
  serviceId: string,
  ruleId: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const vps = service.vpsData || createDefaultVpsData(service.domain || 'vps.host', service.ipAddress || '198.51.100.80');
  const now = new Date().toISOString();

  const updatedService: Service = {
    ...service,
    vpsData: {
      ...vps,
      firewallRules: vps.firewallRules.filter((r) => r.id !== ruleId),
    },
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'system',
        message: `Firewall filter rule removed`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

// Developer Tools Workflows
export function triggerServiceDeployment(
  state: DemoState,
  serviceId: string,
  commitMsg: string = 'Automated deployment via web control center'
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const dev = service.devData || createDefaultDevData(service.domain || 'service');
  const now = new Date().toISOString();
  const hash = Math.random().toString(16).substring(2, 9);

  const newDep = {
    id: createId('dep'),
    commitHash: hash,
    message: commitMsg,
    branch: dev.gitRepo?.branch || 'main',
    status: 'success' as const,
    timestamp: now,
    durationSec: 18,
  };

  const updatedService: Service = {
    ...service,
    devData: {
      ...dev,
      deployments: [newDep, ...dev.deployments],
      gitRepo: dev.gitRepo ? { ...dev.gitRepo, lastCommit: hash } : undefined,
    },
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'web',
        message: `Deployment ${hash} completed successfully in 18s`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function rollbackServiceDeployment(
  state: DemoState,
  serviceId: string,
  deploymentId: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const dev = service.devData || createDefaultDevData(service.domain || 'service');
  const target = dev.deployments.find((d) => d.id === deploymentId);
  if (!target) throw new Error('Deployment not found.');

  const now = new Date().toISOString();
  const rollbackDep = {
    id: createId('dep'),
    commitHash: target.commitHash,
    message: `Rollback to commit ${target.commitHash}`,
    branch: target.branch,
    status: 'success' as const,
    timestamp: now,
    durationSec: 12,
  };

  const updatedService: Service = {
    ...service,
    devData: {
      ...dev,
      deployments: [rollbackDep, ...dev.deployments],
      gitRepo: dev.gitRepo ? { ...dev.gitRepo, lastCommit: target.commitHash } : undefined,
    },
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'web',
        message: `Rolled back to release commit ${target.commitHash}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function addServiceEnvVar(
  state: DemoState,
  serviceId: string,
  key: string,
  value: string,
  masked: boolean = true
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const cleanKey = key.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
  if (!cleanKey) throw new Error('Environment variable name must be uppercase alphanumeric.');

  const dev = service.devData || createDefaultDevData(service.domain || 'service');
  const now = new Date().toISOString();

  const newVar = {
    id: createId('ev'),
    key: cleanKey,
    value,
    masked,
  };

  const updatedService: Service = {
    ...service,
    devData: {
      ...dev,
      envVars: [...dev.envVars.filter((v) => v.key !== cleanKey), newVar],
    },
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'web',
        message: `Environment variable configured: ${cleanKey}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

export function deleteServiceEnvVar(
  state: DemoState,
  serviceId: string,
  envVarId: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const dev = service.devData || createDefaultDevData(service.domain || 'service');
  const now = new Date().toISOString();

  const updatedService: Service = {
    ...service,
    devData: {
      ...dev,
      envVars: dev.envVars.filter((v) => v.id !== envVarId),
    },
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'web',
        message: `Environment variable removed`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}

// Reseller Product Capability Configuration Workflows
export function updateProductCapabilitiesAndLimits(
  state: DemoState,
  productId: string,
  capabilities: CapabilityId[],
  planLimits?: PlanLimits
): DemoState {
  const product = state.products.find((p) => p.id === productId);
  if (!product) throw new Error(`Product ${productId} not found.`);

  const updatedProduct: Product = {
    ...product,
    capabilities,
    planLimits: planLimits || product.planLimits,
  };

  // Coherently propagate capability and limit updates to existing services linked to this product!
  const updatedServices = state.services.map((s) => {
    if (s.productId === productId) {
      return {
        ...s,
        capabilities,
        planLimits: planLimits || s.planLimits,
      };
    }
    return s;
  });

  return {
    ...state,
    products: state.products.map((p) => (p.id === productId ? updatedProduct : p)),
    services: updatedServices,
  };
}

export function updateServiceHostname(
  state: DemoState,
  serviceId: string,
  hostname: string
): DemoState {
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found.`);

  const cleanHost = hostname.trim().toLowerCase();
  const now = new Date().toISOString();

  const updatedService: Service = {
    ...service,
    serverHostname: cleanHost,
    logs: [
      {
        id: createId('lg'),
        timestamp: now,
        severity: 'info',
        category: 'system',
        message: `Server hostname updated to ${cleanHost}`,
      },
      ...(service.logs || []),
    ],
  };

  return {
    ...state,
    services: state.services.map((s) => (s.id === serviceId ? updatedService : s)),
  };
}


