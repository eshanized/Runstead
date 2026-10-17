'use client';

import React from 'react';
import { usePlatformStore } from '@/lib/store/platform-store';
import { StorefrontThemeProvider } from './storefront-theme-provider';
import { StorefrontNavbar } from './storefront-navbar';
import { StorefrontFooter } from './storefront-footer';
import type { StorefrontConfig } from '@/lib/types/storefront';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  overrideConfig?: StorefrontConfig;
}

export function StorefrontLayout({ children, overrideConfig }: StorefrontLayoutProps) {
  const { state } = usePlatformStore();
  // Authoritative published storefront (or draft if editor override specified)
  const config = overrideConfig || state.publishedStorefront || state.storefront;

  return (
    <StorefrontThemeProvider config={config}>
      <StorefrontNavbar config={config} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter config={config} />
    </StorefrontThemeProvider>
  );
}
