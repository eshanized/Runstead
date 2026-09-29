'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  Menu,
  X,
  User,
  ArrowRight,
  Shield,
  Server,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import type { StorefrontConfig } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

interface StorefrontNavbarProps {
  config: StorefrontConfig;
}

export function StorefrontNavbar({ config }: StorefrontNavbarProps) {
  const pathname = usePathname();
  const { state } = useDemo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  const primaryColor = config.primaryColor || '#0f5fff';
  const logoText = config.logoText || config.businessName.slice(0, 2).toUpperCase() || 'CV';
  const cartCount = state.cart?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const header = config.header || {
    sticky: true,
    announcementBar: { enabled: false, text: '', dismissible: true },
    navItems: [],
    primaryCta: { text: 'Get Started', href: '/demo/storefront-preview/hosting', visible: true },
    secondaryCta: { text: 'Client Portal', href: '/demo/storefront-preview/client/login', visible: true },
  };

  const navItems = (header.navItems || []).filter((item) => item.visible);

  return (
    <>
      {/* Optional Announcement Bar */}
      {header.announcementBar?.enabled && !announcementDismissed && (
        <div
          className="px-4 py-2 text-center text-xs font-medium text-white transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          <span>{header.announcementBar.text}</span>
          {header.announcementBar.link && (
            <Link href={header.announcementBar.link} className="underline font-semibold hover:opacity-90">
              Learn more →
            </Link>
          )}
          {header.announcementBar.dismissible && (
            <button
              onClick={() => setAnnouncementDismissed(true)}
              className="ml-2 rounded p-0.5 hover:bg-black/10 text-white/80 hover:text-white"
              aria-label="Dismiss announcement"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Navigation Bar */}
      <header
        className={`bg-white/95 backdrop-blur-md border-b z-40 transition-all ${
          header.sticky ? 'sticky top-0 shadow-sm' : 'relative'
        }`}
        style={{ borderBottomColor: `${primaryColor}20` }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand Identity */}
          <Link href="/demo/storefront-preview" className="flex items-center gap-3 group">
            {config.branding?.logoUrl ? (
              <img
                src={config.branding.logoUrl}
                alt={config.branding.logoAlt || config.businessName}
                className="h-9 w-auto max-w-[140px] object-contain rounded"
              />
            ) : (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-105"
                style={{ backgroundColor: primaryColor }}
              >
                {logoText}
              </span>
            )}
            <span className="font-bold text-lg text-slate-900 tracking-tight">{config.businessName}</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`transition-colors py-1 ${
                    active ? 'font-semibold text-slate-950' : 'hover:text-slate-950 text-slate-600'
                  }`}
                  style={active ? { color: primaryColor } : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions: Cart, Portal, Primary CTA */}
          <div className="hidden items-center gap-3 sm:flex">
            {/* Shopping Cart Button */}
            <Button asChild variant="ghost" size="sm" className="relative text-slate-700 hover:text-slate-900">
              <Link href="/demo/storefront-preview/cart" aria-label="Shopping Cart">
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>

            {/* Client Portal Link */}
            {header.secondaryCta?.visible && (
              <Button asChild variant="ghost" size="sm" className="text-slate-700 hover:text-slate-950 text-xs gap-1.5">
                <Link href={header.secondaryCta.href || '/demo/storefront-preview/client/login'}>
                  <User className="h-3.5 w-3.5" />
                  {header.secondaryCta.text || 'Client Portal'}
                </Link>
              </Button>
            )}

            {/* Primary CTA */}
            {header.primaryCta?.visible && (
              <Button
                asChild
                size="sm"
                className="text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                <Link href={header.primaryCta.href || '/demo/storefront-preview/hosting'}>
                  {header.primaryCta.text || 'Get Started'}
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Hamburger & Cart */}
          <div className="flex items-center gap-2 lg:hidden">
            <Button asChild variant="ghost" size="sm" className="relative p-2">
              <Link href="/demo/storefront-preview/cart" aria-label="Shopping Cart">
                <ShoppingCart className="h-5 w-5 text-slate-700" />
                {cartCount > 0 && (
                  <span
                    className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Open mobile navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-6 flex flex-col justify-between">
                <div>
                  <SheetTitle className="flex items-center gap-2.5 pb-6 border-b">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {logoText}
                    </span>
                    <span className="font-bold text-base text-slate-900">{config.businessName}</span>
                  </SheetTitle>

                  <div className="flex flex-col gap-3 py-6">
                    {navItems.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            active ? 'bg-slate-100 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                          style={active ? { color: primaryColor } : undefined}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t">
                  <Button asChild variant="outline" className="w-full justify-center gap-2 text-xs" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/demo/storefront-preview/client/login">
                      <User className="h-4 w-4" />
                      Client Account Portal
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full justify-center text-xs font-semibold text-white"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/demo/storefront-preview/hosting">
                      Browse Hosting Plans <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
