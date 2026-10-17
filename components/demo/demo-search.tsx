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

    // Core Pages
    const pages = [
      { title: 'Overview Dashboard', href: '/demo/overview', icon: BarChart3, category: 'Navigation' },
      { title: 'Customers', href: '/demo/customers', icon: Users, category: 'Navigation' },
      { title: 'Products & Pricing', href: '/demo/products', icon: Package, category: 'Navigation' },
      { title: 'Orders & Provisioning', href: '/demo/orders', icon: ShoppingCart, category: 'Navigation' },
      { title: 'Services Fleet', href: '/demo/services', icon: Server, category: 'Navigation' },
      { title: 'Domains', href: '/demo/domains', icon: Globe, category: 'Navigation' },
      { title: 'DNS Zones', href: '/demo/dns', icon: Network, category: 'Navigation' },
      { title: 'Invoices & Billing', href: '/demo/invoices', icon: FileText, category: 'Navigation' },
      { title: 'Support Tickets', href: '/demo/tickets', icon: LifeBuoy, category: 'Navigation' },
      { title: 'Business Analytics', href: '/demo/analytics', icon: BarChart3, category: 'Navigation' },
      { title: 'Storefront Editor', href: '/demo/storefront', icon: Store, category: 'Navigation' },
      { title: 'Storefront Preview (Customer View)', href: '/demo/storefront-preview', icon: ExternalLink, category: 'Navigation' },
      { title: 'Storefront Checkout & Provisioning', href: '/demo/checkout', icon: ShoppingCart, category: 'Navigation' },
      { title: 'Platform Operator Console (Tonmoy Admin)', href: '/demo/platform-admin', icon: Shield, category: 'Platform' },
      { title: 'SaaS Tenant Launch Wizard', href: '/demo/launch', icon: ExternalLink, category: 'Platform' },
      { title: 'Settings', href: '/demo/settings', icon: Settings, category: 'Navigation' },
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
          subtitle: `${c.email} &bull; ${c.company || 'Individual'}`,
          href: `/demo/customers?search=${encodeURIComponent(c.name)}`,
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
          subtitle: `${prod.type.replace(/_/g, ' ')} &bull; ${prod.available ? 'Active' : 'Unavailable'}`,
          href: `/demo/products?search=${encodeURIComponent(prod.name)}`,
          icon: Package,
        });
      }
    }

    // Orders
    for (const ord of state.orders) {
      if (ord.orderNumber.toLowerCase().includes(q) || ord.customerName.toLowerCase().includes(q) || ord.productName.toLowerCase().includes(q)) {
        list.push({
          id: `ord_${ord.id}`,
          category: 'Orders',
          title: `${ord.orderNumber} - ${ord.productName}`,
          subtitle: `${ord.customerName} &bull; Status: ${ord.status}`,
          href: `/demo/orders?search=${encodeURIComponent(ord.orderNumber)}`,
          icon: ShoppingCart,
        });
      }
    }

    // Services
    for (const srv of state.services) {
      if (srv.serviceName.toLowerCase().includes(q) || (srv.domain && srv.domain.toLowerCase().includes(q)) || srv.customerName.toLowerCase().includes(q)) {
        list.push({
          id: `srv_${srv.id}`,
          category: 'Services',
          title: `${srv.productName} (${srv.domain || 'No domain'})`,
          subtitle: `${srv.customerName} &bull; Status: ${srv.status}`,
          href: `/demo/services?search=${encodeURIComponent(srv.domain || srv.productName)}`,
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
          title: `${inv.invoiceNumber} (${inv.customerName})`,
          subtitle: `Total: ${inv.total} ${inv.currency} &bull; Status: ${inv.status}`,
          href: `/demo/invoices?search=${encodeURIComponent(inv.invoiceNumber)}`,
          icon: FileText,
        });
      }
    }

    // Tickets
    for (const tkt of state.tickets) {
      if (tkt.ticketNumber.toLowerCase().includes(q) || tkt.subject.toLowerCase().includes(q) || tkt.customerName.toLowerCase().includes(q)) {
        list.push({
          id: `tkt_${tkt.id}`,
          category: 'Tickets',
          title: `${tkt.ticketNumber}: ${tkt.subject}`,
          subtitle: `${tkt.customerName} &bull; Priority: ${tkt.priority}`,
          href: `/demo/tickets?search=${encodeURIComponent(tkt.ticketNumber)}`,
          icon: LifeBuoy,
        });
      }
    }

    return list.slice(0, 16);
  }, [query, state]);

  function handleSelect(href: string) {
    onOpenChange(false);
    setQuery('');
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden shadow-2xl border-border/80">
        <DialogHeader className="sr-only">
          <DialogTitle>Search demo dashboard</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b px-3 py-2 bg-card">
          <Search className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
          <Input
            placeholder="Type a command or search customers, orders, services..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 text-sm h-10 px-0"
            autoFocus
          />
          <Badge variant="outline" className="text-[10px] font-mono shrink-0 ml-2">ESC</Badge>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-border/40 scrollbar-thin">
          {results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.href)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-muted/60 text-left transition-colors text-sm group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1 rounded bg-muted text-muted-foreground group-hover:text-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{item.title}</div>
                        {item.subtitle && (
                          <div
                            className="text-xs text-muted-foreground truncate"
                            dangerouslySetInnerHTML={{ __html: item.subtitle }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="secondary" className="text-[10px] py-0">{item.category}</Badge>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-3 py-2 bg-muted/30 text-[11px] text-muted-foreground">
          <span>Navigate with click or arrow keys</span>
          <div className="flex items-center gap-1">
            <span>Open search:</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
            <span>/</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl+K</kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
