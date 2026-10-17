'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Users, Package, ShoppingCart, Server, Globe,
  Network, FileText, LifeBuoy, BarChart3, Store, Settings,
  Shield, ExternalLink, ArrowRight
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SearchResultItem {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function GlobalSearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { state } = useDemo();
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list: SearchResultItem[] = [];

    // Core Dashboard Pages
    const pages = [
      { title: 'Overview Dashboard', href: '/dashboard/overview', icon: BarChart3, category: 'Navigation' },
      { title: 'Customers', href: '/dashboard/customers', icon: Users, category: 'Navigation' },
      { title: 'Products & Pricing', href: '/dashboard/products', icon: Package, category: 'Navigation' },
      { title: 'Orders & Provisioning', href: '/dashboard/orders', icon: ShoppingCart, category: 'Navigation' },
      { title: 'Services Fleet', href: '/dashboard/services', icon: Server, category: 'Navigation' },
      { title: 'Domains', href: '/dashboard/domains', icon: Globe, category: 'Navigation' },
      { title: 'DNS Zones', href: '/dashboard/dns', icon: Network, category: 'Navigation' },
      { title: 'Invoices & Billing', href: '/dashboard/invoices', icon: FileText, category: 'Navigation' },
      { title: 'Support Tickets', href: '/dashboard/tickets', icon: LifeBuoy, category: 'Navigation' },
      { title: 'Business Analytics', href: '/dashboard/analytics', icon: BarChart3, category: 'Navigation' },
      { title: 'Storefront Editor', href: '/dashboard/storefront', icon: Store, category: 'Navigation' },
      { title: 'Storefront Preview (Customer View)', href: '/storefront', icon: ExternalLink, category: 'Navigation' },
      { title: 'Storefront Checkout & Provisioning', href: '/storefront/checkout', icon: ShoppingCart, category: 'Navigation' },
      { title: 'Platform Operator Console', href: '/dashboard/platform-admin', icon: Shield, category: 'Platform' },
      { title: 'SaaS Tenant Launch Wizard', href: '/dashboard/launch', icon: ExternalLink, category: 'Platform' },
      { title: 'Settings', href: '/dashboard/settings', icon: Settings, category: 'Navigation' },
    ];

    for (const p of pages) {
      if (!q || p.title.toLowerCase().includes(q)) {
        list.push({ id: `page_${p.href}`, ...p });
      }
    }

    if (!q) {
      return list.slice(0, 10);
    }

    // Customers
    for (const c of state.customers) {
      if (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company && c.company.toLowerCase().includes(q))) {
        list.push({
          id: `cust_${c.id}`,
          category: 'Customers',
          title: c.name,
          subtitle: `${c.email} • ${c.company || 'Individual'}`,
          href: `/dashboard/customers?search=${encodeURIComponent(c.name)}`,
          icon: Users,
        });
      }
    }

    // Products
    for (const prod of state.products) {
      if (prod.name.toLowerCase().includes(q) || prod.type.toLowerCase().includes(q) || prod.description.toLowerCase().includes(q)) {
        list.push({
          id: `prod_${prod.id}`,
          category: 'Products',
          title: prod.name,
          subtitle: `${prod.type.replace(/_/g, ' ')} • ${prod.available ? 'Active' : 'Unavailable'}`,
          href: `/dashboard/products?search=${encodeURIComponent(prod.name)}`,
          icon: Package,
        });
      }
    }

    // Orders
    for (const ord of state.orders) {
      if (ord.orderNumber.toLowerCase().includes(q) || ord.customerName.toLowerCase().includes(q)) {
        list.push({
          id: `ord_${ord.id}`,
          category: 'Orders',
          title: `Order ${ord.orderNumber} - ${ord.customerName}`,
          subtitle: `${ord.status.replace(/_/g, ' ')} • $${ord.amount.toFixed(2)}`,
          href: `/dashboard/orders?search=${encodeURIComponent(ord.orderNumber)}`,
          icon: ShoppingCart,
        });
      }
    }

    // Services
    for (const s of state.services) {
      if (s.serviceName.toLowerCase().includes(q) || (s.domain && s.domain.toLowerCase().includes(q)) || s.customerName.toLowerCase().includes(q)) {
        list.push({
          id: `srv_${s.id}`,
          category: 'Services',
          title: `${s.serviceName} (${s.domain || 'No domain'})`,
          subtitle: `${s.customerName} • ${s.status}`,
          href: `/dashboard/services?search=${encodeURIComponent(s.domain || s.serviceName)}`,
          icon: Server,
        });
      }
    }

    // Invoices
    for (const inv of state.invoices) {
      if (inv.invoiceNumber.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q)) {
        list.push({
          id: `inv_${inv.id}`,
          category: 'Invoices',
          title: `Invoice ${inv.invoiceNumber} - ${inv.customerName}`,
          subtitle: `${inv.status.toUpperCase()} • $${inv.total.toFixed(2)}`,
          href: `/dashboard/invoices?search=${encodeURIComponent(inv.invoiceNumber)}`,
          icon: FileText,
        });
      }
    }

    // Support Tickets
    for (const t of state.tickets) {
      if (t.ticketNumber.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q)) {
        list.push({
          id: `ticket_${t.id}`,
          category: 'Support',
          title: `[${t.ticketNumber}] ${t.subject}`,
          subtitle: `${t.customerName} • ${t.status}`,
          href: `/dashboard/tickets?search=${encodeURIComponent(t.ticketNumber)}`,
          icon: LifeBuoy,
        });
      }
    }

    // Domains
    for (const d of state.domains) {
      if (d.domain.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q)) {
        list.push({
          id: `dom_${d.id}`,
          category: 'Domains',
          title: d.domain,
          subtitle: `${d.customerName} • ${d.status}`,
          href: `/dashboard/domains?search=${encodeURIComponent(d.domain)}`,
          icon: Globe,
        });
      }
    }

    // DNS Zones
    for (const zone of state.dnsZones) {
      const zoneDomain = (zone as any).domain || (zone as any).zoneName || '';
      if (zoneDomain.toLowerCase().includes(q)) {
        const count = Array.isArray(zone.records) ? zone.records.length : ((zone as any).recordCount || 0);
        list.push({
          id: `zone_${zone.id}`,
          category: 'DNS Zones',
          title: zoneDomain,
          subtitle: `${count} active DNS records`,
          href: `/dashboard/dns?zoneId=${zone.id}`,
          icon: Network,
        });
      }
    }

    return list;
  }, [query, state]);

  function handleSelect(item: SearchResultItem) {
    onOpenChange(false);
    setQuery('');
    router.push(item.href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Platform Records</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b px-3 bg-muted/20">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, services, orders, invoices, domains, zones..."
            className="border-0 shadow-none focus-visible:ring-0 text-sm h-12 bg-transparent"
            autoFocus
          />
          {query && (
            <Button variant="ghost" size="sm" onClick={() => setQuery('')} className="h-6 px-2 text-xs">
              Clear
            </Button>
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-border/40 scrollbar-thin">
          {results.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No platform records matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-accent/10 text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="p-1.5 rounded-md bg-muted text-foreground/80 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-foreground truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[11px] text-muted-foreground truncate">{item.subtitle}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px] font-normal uppercase py-0 h-4">
                      {item.category}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground flex items-center justify-between border-t">
          <span>Navigate with mouse or Tab • Enter to select</span>
          <span className="font-mono text-[10px]">ESC to close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
