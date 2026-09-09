import type {
  Customer, Product, Order, Service, Domain, Invoice, Ticket,
  DnsRecord, DnsZone, DemoState, StorefrontSettings, BusinessSettings,
  Integration, OrderStatus, ServiceStatus, InvoiceStatus, TicketStatus,
} from './types';

export function searchCustomers(customers: Customer[], query: string): Customer[] {
  if (!query.trim()) return customers;
  const q = query.toLowerCase();
  return customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company ?? '').toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
  );
}

export function sortCustomers(customers: Customer[], sortBy: string, asc: boolean): Customer[] {
  const sorted = [...customers].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'email': cmp = a.email.localeCompare(b.email); break;
      case 'totalRevenue': cmp = a.totalRevenue - b.totalRevenue; break;
      case 'createdAt': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      case 'servicesCount': cmp = a.servicesCount - b.servicesCount; break;
      default: cmp = 0;
    }
    return asc ? cmp : -cmp;
  });
  return sorted;
}

export function filterCustomersByStatus(customers: Customer[], status: string): Customer[] {
  if (status === 'all') return customers;
  return customers.filter((c) => c.status === status);
}

export function paginate<T>(items: T[], page: number, perPage: number): T[] {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

export function totalPages(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}

export function searchProducts(products: Product[], query: string): Product[] {
  if (!query.trim()) return products;
  const q = query.toLowerCase();
  return products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
  );
}

export function filterProductsByType(products: Product[], type: string): Product[] {
  if (type === 'all') return products;
  return products.filter((p) => p.type === type);
}

export function searchOrders(orders: Order[], query: string): Order[] {
  if (!query.trim()) return orders;
  const q = query.toLowerCase();
  return orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.productName.toLowerCase().includes(q)
  );
}

export function filterOrdersByStatus(orders: Order[], status: string): Order[] {
  if (status === 'all') return orders;
  return orders.filter((o) => o.status === status);
}

export function searchServices(services: Service[], query: string): Service[] {
  if (!query.trim()) return services;
  const q = query.toLowerCase();
  return services.filter(
    (s) =>
      s.serviceName.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      (s.domain ?? '').toLowerCase().includes(q)
  );
}

export function filterServicesByStatus(services: Service[], status: string): Service[] {
  if (status === 'all') return services;
  return services.filter((s) => s.status === status);
}

export function searchDomains(domains: Domain[], query: string): Domain[] {
  if (!query.trim()) return domains;
  const q = query.toLowerCase();
  return domains.filter(
    (d) =>
      d.domain.toLowerCase().includes(q) ||
      d.customerName.toLowerCase().includes(q) ||
      d.registrar.toLowerCase().includes(q)
  );
}

export function searchInvoices(invoices: Invoice[], query: string): Invoice[] {
  if (!query.trim()) return invoices;
  const q = query.toLowerCase();
  return invoices.filter(
    (i) =>
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.customerName.toLowerCase().includes(q)
  );
}

export function filterInvoicesByStatus(invoices: Invoice[], status: string): Invoice[] {
  if (status === 'all') return invoices;
  return invoices.filter((i) => i.status === status);
}

export function searchTickets(tickets: Ticket[], query: string): Ticket[] {
  if (!query.trim()) return tickets;
  const q = query.toLowerCase();
  return tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(q) ||
      t.ticketNumber.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q)
  );
}

export function filterTicketsByStatus(tickets: Ticket[], status: string): Ticket[] {
  if (status === 'all') return tickets;
  return tickets.filter((t) => t.status === status);
}

export function filterTicketsByPriority(tickets: Ticket[], priority: string): Ticket[] {
  if (priority === 'all') return tickets;
  return tickets.filter((t) => t.priority === priority);
}

export function getZoneByDomain(zones: DnsZone[], domain: string): DnsZone | undefined {
  return zones.find((z) => z.domain === domain);
}

export function getZoneById(zones: DnsZone[], id: string): DnsZone | undefined {
  return zones.find((z) => z.id === id);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const DEMO_REFERENCE_DATE = '2026-10-14T12:00:00Z';

export function relativeTime(dateStr: string): string {
  const now = new Date(DEMO_REFERENCE_DATE);
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

export function getDashboardStats(state: DemoState) {
  const activeCustomers = state.customers.filter((c) => c.status === 'active' && !c.archived).length;
  const activeServices = state.services.filter((s) => s.status === 'active').length;
  const pendingOrders = state.orders.filter(
    (o) => o.status === 'awaiting_payment' || o.status === 'provisioning'
  ).length;
  const outstandingInvoices = state.invoices.filter(
    (i) => i.status === 'sent' || i.status === 'overdue'
  );
  const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + i.total, 0);

  const monthlyRecurring = state.services
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => {
      const monthlyPrice =
        s.billingCycle === 'annually' ? s.price / 12 :
        s.billingCycle === 'quarterly' ? s.price / 3 :
        s.billingCycle === 'semi_annually' ? s.price / 6 :
        s.price;
      return sum + monthlyPrice;
    }, 0);

  const renewalsDue = state.services.filter((s) => {
    const renewal = new Date(s.nextRenewalDate);
    const now = new Date(DEMO_REFERENCE_DATE);
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return renewal <= thirtyDays && s.status === 'active';
  }).length;

  const totalPaidRevenue = state.invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0);

  return {
    monthlyRecurringRevenue: Math.round(monthlyRecurring),
    activeCustomers,
    activeServices,
    pendingOrders,
    outstandingInvoices: outstandingInvoices.length,
    outstandingTotal: Math.round(outstandingTotal * 100) / 100,
    renewalsDue,
    totalPaidRevenue: Math.round(totalPaidRevenue * 100) / 100,
  };
}

export function getRevenueChartData(state: DemoState) {
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const historicalMonthly = [3200, 3800, 4100, 4500, 5200];
  
  // October revenue dynamically reflects historical baseline + current demo paid invoices
  const octPaidRevenue = state.invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0);

  const octTotal = 5200 + Math.round(octPaidRevenue);
  const fullSeries = [...historicalMonthly, octTotal];

  return months.map((month, i) => ({
    month,
    revenue: fullSeries[i],
    expenses: Math.round(fullSeries[i] * 0.55),
  }));
}

export function getCustomerGrowthData(state: DemoState) {
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const historicalCounts = [42, 55, 68, 79, 88];
  const activeCount = state.customers.filter((c) => c.status === 'active' && !c.archived).length;
  const currentTotal = 88 + activeCount;
  const fullCounts = [...historicalCounts, currentTotal];

  return months.map((month, i) => ({ month, customers: fullCounts[i] }));
}

export function getSalesByProduct(state: DemoState) {
  const productMap = new Map<string, number>();
  state.invoices
    .filter((i) => i.status === 'paid')
    .forEach((inv) => {
      inv.lineItems.forEach((li) => {
        const cleanName = li.description.split('—')[0].trim();
        const current = productMap.get(cleanName) ?? 0;
        productMap.set(cleanName, current + li.total);
      });
    });
  return Array.from(productMap.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export function getServiceDistribution(state: DemoState) {
  const dist = new Map<string, number>();
  state.services
    .filter((s) => s.status === 'active')
    .forEach((s) => {
      const current = dist.get(s.productName) ?? 0;
      dist.set(s.productName, current + 1);
    });
  return Array.from(dist.entries()).map(([name, value]) => ({ name, value }));
}

export function getPlatformStats(state: DemoState) {
  const tenants = state.platformOperator?.tenants || [];
  const activeTenants = tenants.filter((t) => t.status === 'active').length;
  const totalMrr = tenants.reduce((sum, t) => sum + (t.status === 'active' ? t.mrr : 0), 0);
  const totalArr = totalMrr * 12;

  const planDist: Record<string, number> = {
    Sandbox: 0,
    Launch: 0,
    Growth: 0,
    Scale: 0,
    Enterprise: 0,
  };

  tenants.forEach((t) => {
    if (planDist[t.plan] !== undefined) {
      planDist[t.plan]++;
    }
  });

  return {
    totalTenants: tenants.length,
    activeTenants,
    totalMrr,
    totalArr,
    planDistribution: Object.entries(planDist).map(([plan, count]) => ({ plan, count })),
    avgMrrPerTenant: activeTenants > 0 ? Math.round(totalMrr / activeTenants) : 0,
  };
}

export function getRecentOrders(state: DemoState, limit = 5): Order[] {
  return [...state.orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getRecentServices(state: DemoState, limit = 5): Service[] {
  return [...state.services]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getRecentInvoices(state: DemoState, limit = 5): Invoice[] {
  return [...state.invoices]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, limit);
}

export function getSystemStatus(state: DemoState) {
  return [
    { service: 'Web Application', status: 'operational', uptime: '99.98%' },
    { service: 'API Gateway', status: 'operational', uptime: '99.99%' },
    { service: 'Database', status: 'operational', uptime: '99.97%' },
    { service: 'Provisioning Engine', status: 'degraded', uptime: '98.21%' },
    { service: 'Email Delivery', status: 'operational', uptime: '99.95%' },
    { service: 'DNS Cluster', status: 'operational', uptime: '99.99%' },
  ];
}

export function checkDomainAvailability(domain: string): { available: boolean; price: number; tld: string } {
  const tld = domain.split('.').pop() ?? '';
  const basePrice: Record<string, number> = {
    com: 12.99, net: 14.99, org: 13.99, io: 32.99, co: 24.99, ng: 18.99, de: 9.99,
    nl: 11.99, in: 8.99, biz: 9.99, info: 11.99, store: 49.99, tech: 39.99,
  };
  const price = basePrice[tld] ?? 19.99;
  const hash = domain.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const available = hash % 3 !== 0;
  return { available, price, tld };
}

export function getFilteredIntegrations(integrations: Integration[], category: string): Integration[] {
  if (category === 'all') return integrations;
  return integrations.filter((i) => i.category === category);
}
