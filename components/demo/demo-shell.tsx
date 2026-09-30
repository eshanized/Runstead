'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Users, Package, ShoppingCart, Server, Globe,
  Network, FileText, LifeBuoy, BarChart3, Store, Plug, Settings,
  Rocket, Menu, Bell, Search, RotateCcw, LogOut, ExternalLink,
  Shield, Check, CheckCheck, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { DemoProvider, useDemo } from '@/lib/demo/store';
import { demoNav } from '@/lib/config/navigation';
import { cn } from '@/lib/utils';
import { relativeTime } from '@/lib/demo/selectors';
import { GlobalSearchDialog } from './demo-search';
import { toast } from 'sonner';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Package, ShoppingCart, Server, Globe,
  Network, FileText, LifeBuoy, BarChart3, Store, Plug, Settings, Rocket,
};

function navItems() {
  return demoNav;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = navItems();

  return (
    <nav className="flex flex-col gap-1 p-3">
      <Link
        href="/demo/overview"
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          pathname === '/demo/overview' || pathname === '/demo'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <LayoutDashboard className="h-4 w-4" />
        Overview
      </Link>
      {items.slice(1).map((item) => {
        const Icon = iconMap[item.icon] ?? LayoutDashboard;
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}

      <div className="pt-4 pb-1 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Platform Operations
      </div>
      <Link
        href="/demo/platform-admin"
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          pathname === '/demo/platform-admin'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Shield className="h-4 w-4 text-accent" />
        Platform Admin
      </Link>
      <Link
        href="/demo/storefront-preview"
        target="_blank"
        onClick={onNavigate}
        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-3">
          <Store className="h-4 w-4" />
          Storefront Preview
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
          <span className="font-semibold">Notifications</span>
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

function DemoTopbar() {
  const { state, resetDemo } = useDemo();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Compute initials from business name
  const businessInitials = state.business.businessName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'HP';

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border/60 bg-background px-4">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open mobile navigation menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
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
            aria-label="Search demo records (Press Ctrl+K)"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              <span>Search demo data...</span>
            </span>
            <kbd className="hidden sm:inline-block rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex gap-1.5 border-accent/30 text-accent">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            DEMO MODE
          </Badge>

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
                <Link href="/demo/platform-admin">
                  <Shield className="mr-2 h-4 w-4 text-accent" /> Platform Operator Console
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/demo/storefront-preview" target="_blank">
                  <Store className="mr-2 h-4 w-4" /> White-Label Storefront
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/demo/launch">
                  <Rocket className="mr-2 h-4 w-4" /> Tenant Launch Wizard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/demo/settings">
                  <Settings className="mr-2 h-4 w-4" /> Reseller Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetDemo}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset demo data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">
                  <ExternalLink className="mr-2 h-4 w-4" /> Back to website
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/demo">
                  <LogOut className="mr-2 h-4 w-4" /> Demo home
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

export function DemoLayout({ children }: { children: React.ReactNode }) {
  const { isHydrated, resetDemo } = useDemo();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading demo...</div>
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
            <span className="text-[10px] text-muted-foreground leading-tight">Demo Dashboard</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <SidebarContent />
        </div>
        <div className="border-t border-border/60 p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              if (confirm('Reset all demo data to its original state?')) {
                resetDemo();
              }
            }}
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Reset demo data
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        <DemoTopbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DemoShell({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <DemoLayout>{children}</DemoLayout>
    </DemoProvider>
  );
}
