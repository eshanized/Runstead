'use client';

import React from 'react';
import { useDemo } from '@/lib/demo/store';
import { StorefrontThemeProvider } from './storefront-theme-provider';
import { StorefrontDemoBanner } from './storefront-demo-banner';
import { StorefrontNavbar } from './storefront-navbar';
import { StorefrontFooter } from './storefront-footer';
import type { StorefrontConfig } from '@/lib/demo/types';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  overrideConfig?: StorefrontConfig;
  hideDemoBanner?: boolean;
}

export function StorefrontLayout({ children, overrideConfig, hideDemoBanner = false }: StorefrontLayoutProps) {
  const { state } = useDemo();
  // Authoritative published storefront (or draft if override specified)
  const config = overrideConfig || state.publishedStorefront || state.storefront;

  return (
    <StorefrontThemeProvider config={config}>
      {!hideDemoBanner && <StorefrontDemoBanner businessName={config.businessName} />}
      <StorefrontNavbar config={config} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter config={config} />
    </StorefrontThemeProvider>
  );
}
