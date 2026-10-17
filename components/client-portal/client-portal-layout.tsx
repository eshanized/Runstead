'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  Globe,
  FileText,
  LifeBuoy,
  User,
  LogOut,
  ExternalLink,
  ChevronDown,
  ShieldAlert,
  ArrowLeft,
  Users,
  Compass,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DemoTourGuideDialog } from '@/components/demo/demo-tour-guide';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ClientPortalLayoutProps {
  children: React.ReactNode;
}

export function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, setState } = useDemo();
  const [tourOpen, setTourOpen] = useState(false);
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const activeCustomerId = state.activeClientCustomerId || state.customers[0]?.id;
  const customer = state.customers.find((c) => c.id === activeCustomerId) || state.customers[0];

  function handleSwitchCustomer(custId: string) {
    setState((prev) => ({ ...prev, activeClientCustomerId: custId }));
    router.refresh();
  }

  function handleSignOut() {
    setState((prev) => ({ ...prev, activeClientCustomerId: null }));
    router.push('/demo/storefront-preview/client/login');
  }

  const navLinks = [
    { label: 'Overview', href: '/demo/storefront-preview/client/dashboard', icon: LayoutDashboard },
    { label: 'My Services', href: '/demo/storefront-preview/client/services', icon: Server },
    { label: 'My Domains', href: '/demo/storefront-preview/client/domains', icon: Globe },
    { label: 'Invoices & Billing', href: '/demo/storefront-preview/client/invoices', icon: FileText },
    { label: 'Support Tickets', href: '/demo/storefront-preview/client/tickets', icon: LifeBuoy },
    { label: 'Account Profile', href: '/demo/storefront-preview/client/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Demo Context Banner */}
      <div className="border-b border-indigo-500/20 bg-indigo-950 px-4 py-2 text-xs text-indigo-200">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">White-Label Customer Portal:</span>
            <span className="hidden sm:inline">
              Simulated end-client portal for <strong>{config.businessName}</strong>. Demonstrates service, billing, and ticket isolation.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulation Guide Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTourOpen(true)}
              className="h-6 text-[11px] bg-indigo-600/80 border-indigo-400/60 text-white hover:bg-indigo-600 font-semibold"
            >
              <Compass className="h-3 w-3 mr-1 text-indigo-200" />
              Simulation Guide
            </Button>

            {/* Quick Switch Demo Account */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-6 text-[11px] bg-slate-900/60 border-indigo-400/40 text-indigo-100 hover:text-white">
                  <Users className="h-3 w-3 mr-1 text-indigo-300" />
                  Switch Demo Customer <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs">Select Seeded Customer</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {state.customers.slice(0, 6).map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => handleSwitchCustomer(c.id)}
                    className="text-xs flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[170px]">{c.email}</div>
                    </div>
                    {c.id === customer?.id && <Badge className="text-[9px] h-4 bg-emerald-600">Active</Badge>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild size="sm" variant="ghost" className="h-6 text-[11px] text-indigo-200 hover:text-white hover:bg-indigo-900">
              <Link href="/demo/storefront-preview">
                <ArrowLeft className="mr-1 h-3 w-3" /> Storefront
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="h-6 text-[11px] text-indigo-200 hover:text-white hover:bg-indigo-900">
              <Link href="/demo/overview">
                Reseller Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Portal Navbar */}
      <header className="border-b bg-white sticky top-0 z-30 shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/demo/storefront-preview/client/dashboard" className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                {config.logoText || config.businessName.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <span className="font-bold text-sm text-slate-900 tracking-tight block">{config.businessName}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Customer Client Portal</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? 'bg-slate-100 font-semibold text-slate-950'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                    style={active ? { color: primaryColor } : undefined}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User profile dropdown & sign out */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-full border border-slate-200 p-1 pr-3 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {customer?.name.slice(0, 2).toUpperCase() || 'CU'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-none">{customer?.name}</div>
                    <div className="text-[10px] text-slate-400 leading-none mt-1">{customer?.company || 'Personal Account'}</div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-xs">
                <DropdownMenuLabel>
                  <div className="font-bold">{customer?.name}</div>
                  <div className="text-[11px] text-slate-500 font-normal">{customer?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/demo/storefront-preview/client/profile">
                    <User className="mr-2 h-3.5 w-3.5" /> Edit Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/demo/storefront-preview/client/invoices">
                    <FileText className="mr-2 h-3.5 w-3.5" /> Invoices & Receipts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/demo/storefront-preview/client/tickets">
                    <LifeBuoy className="mr-2 h-3.5 w-3.5" /> Open Support Ticket
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-rose-600 cursor-pointer">
                  <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs font-medium">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
                  active ? 'bg-slate-100 font-semibold' : 'text-slate-600'
                }`}
                style={active ? { color: primaryColor } : undefined}
              >
                <Icon className="h-3 w-3" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-16">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{config.businessName} Customer Portal • Secure Simulated Environment</span>
          <div className="flex items-center gap-3 text-slate-400">
            <Link href="/demo/storefront-preview" className="hover:text-slate-700">Public Storefront</Link>
            <span>•</span>
            <Link href="/demo/storefront-preview/support" className="hover:text-slate-700">Support Desk</Link>
            <span>•</span>
            <Link href="/demo/overview" className="hover:text-slate-700">Reseller Dashboard</Link>
          </div>
        </div>
      </footer>

      {/* Product Simulation Explorer Tour Guide */}
      <DemoTourGuideDialog open={tourOpen} onOpenChange={setTourOpen} />
    </div>
  );
}
