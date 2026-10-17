'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Users, Package, ShoppingCart, Server, Globe,
  Network, FileText, LifeBuoy, BarChart3, Store, Plug, Settings,
  Rocket, Menu, Bell, Search, LogOut, ExternalLink, Shield, CheckCheck, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { DemoProvider, useDemo } from '@/lib/demo/store';
import { cn } from '@/lib/utils';
import { relativeTime } from '@/lib/demo/selectors';
import { GlobalSearchDialog } from './dashboard-search';
import { toast } from 'sonner';

export const dashboardNavItems = [
  { label: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
  { label: 'Customers', href: '/dashboard/customers', icon: Users },
  { label: 'Products', href: '/dashboard/products', icon: Package },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { label: 'Services', href: '/dashboard/services', icon: Server },
  { label: 'Domains', href: '/dashboard/domains', icon: Globe },
  { label: 'DNS Zones', href: '/dashboard/dns', icon: Network },
  { label: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { label: 'Support', href: '/dashboard/tickets', icon: LifeBuoy },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Storefront', href: '/dashboard/storefront', icon: Store },
  { label: 'Integrations', href: '/dashboard/integrations', icon: Plug },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Onboarding', href: '/dashboard/onboarding', icon: Rocket },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {dashboardNavItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== '/dashboard/overview' && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}

      <div className="pt-4 pb-1 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Platform Operations
      </div>
      <Link
        href="/dashboard/platform-admin"
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          pathname === '/dashboard/platform-admin'
            ? 'bg-primary text-primary-foreground font-semibold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Shield className="h-4 w-4 text-accent" />
        Platform Admin
      </Link>
      <Link
        href="/storefront"
        target="_blank"
        onClick={onNavigate}
        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-3">
          <Store className="h-4 w-4" />
          Customer Storefront
        </span>
        <ExternalLink className="h-3 w-3 opacity-60" />
      </Link>
      <Link
        href="/client/dashboard"
        target="_blank"
        onClick={onNavigate}
        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-3">
          <Server className="h-4 w-4" />
          Client Hosting Portal
        </span>
        <ExternalLink className="h-3 w-3 opacity-60" />
      </Link>
    </nav>
  );
}

function NotificationsDropdown() {
  const { state, setState } = useDemo();
  const unreadCount = state.notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
    toast.success('All notifications marked as read');
  }

  function clearAll() {
    setState((prev) => ({
      ...prev,
      notifications: [],
    }));
    toast.success('Notifications cleared');
  }

  function markSingleRead(id: string) {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${unreadCount} unread)`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-accent" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Platform Notifications</span>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={markAllRead}>
                <CheckCheck className="h-3 w-3 mr-1" /> Read all
              </Button>
            )}
            {state.notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-muted-foreground hover:text-destructive" onClick={clearAll}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {state.notifications.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No active notifications
          </div>
        ) : (
          state.notifications.slice(0, 6).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start py-2 cursor-pointer"
              onClick={() => markSingleRead(n.id)}
            >
              <div className="flex items-center gap-2 w-full">
                {!n.read && <span className="h-2 w-2 rounded-full bg-accent shrink-0" />}
                <span className={cn('text-sm font-medium flex-1', n.read ? 'text-muted-foreground' : 'text-foreground')}>
                  {n.title}
                </span>
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">{n.description}</span>
              <span className="text-xs text-muted-foreground/60 mt-0.5">{relativeTime(n.timestamp)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DashboardTopbar() {
  const { state } = useDemo();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const businessInitials = state.business.businessName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'RP';

  return (
    <>
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 text-xs text-slate-300 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">Runstead Infrastructure Platform</span>
          <span className="hidden md:inline text-slate-400">— Active Multi-Tenant Engine & Database Layer</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-emerald-400 font-medium">● Systems Nominal</span>
        </div>
      </div>
      <header className="flex h-14 items-center justify-between border-b border-border/60 bg-background px-4">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open mobile navigation menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Dashboard Navigation</SheetTitle>
              <div className="flex h-14 items-center gap-2 border-b px-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Server className="h-4 w-4" />
                </span>
                <span className="font-bold text-sm truncate">{state.business.businessName}</span>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Interactive Global Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/40 hover:bg-muted border rounded-md transition-colors w-48 sm:w-64 justify-between"
            aria-label="Search records (Press Ctrl+K)"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              <span>Search platform records...</span>
            </span>
            <kbd className="hidden sm:inline-block rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <NotificationsDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="User profile and business options">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
                  {businessInitials}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{state.business.businessName}</span>
                  <span className="text-xs text-muted-foreground">Tenant Plan: {state.business.currentPlan}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/platform-admin">
                  <Shield className="mr-2 h-4 w-4 text-accent" /> Platform Operator Console
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/storefront" target="_blank">
                  <Store className="mr-2 h-4 w-4" /> Customer Storefront
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/client/dashboard" target="_blank">
                  <Server className="mr-2 h-4 w-4" /> Customer Hosting Portal
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/launch">
                  <Rocket className="mr-2 h-4 w-4" /> Tenant Launch Preflight
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" /> Reseller Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                  } catch {}
                  window.location.href = '/login';
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">
                  <ExternalLink className="mr-2 h-4 w-4" /> Back to website
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isHydrated } = useDemo();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading platform console...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-card lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Server className="h-4 w-4" />
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">Runstead</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Reseller Platform</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <SidebarContent />
        </div>
        <div className="border-t border-border/60 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Database Online
            </span>
            <span className="text-[10px] font-mono bg-muted px-1 rounded">v1.0.0</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
              } catch {}
              window.location.href = '/login';
            }}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        <DashboardTopbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </DemoProvider>
  );
}
