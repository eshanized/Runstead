'use client';

import React from 'react';
import type { StorefrontConfig, StorefrontThemeConfig } from '@/lib/demo/types';

interface StorefrontThemeProviderProps {
  config: StorefrontConfig;
  children: React.ReactNode;
  className?: string;
}

export function StorefrontThemeProvider({ config, children, className = '' }: StorefrontThemeProviderProps) {
  const theme: StorefrontThemeConfig = config.theme || {
    preset: 'modern-cloud',
    primaryColor: config.primaryColor || '#0f5fff',
    accentColor: config.accentColor || '#00c896',
    secondaryColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    surfaceColor: '#f8fafc',
    textColor: '#0f172a',
    mutedColor: '#64748b',
    fontHeading: 'plus-jakarta',
    fontBody: 'inter',
    borderRadius: 'md',
    buttonStyle: 'rounded',
    contentWidth: 'normal',
    spacing: 'comfortable',
  };

  const radiusMap: Record<string, string> = {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  };

  const buttonRadiusMap: Record<string, string> = {
    square: '0px',
    rounded: '8px',
    pill: '9999px',
    'outline-fill': '6px',
  };

  const maxWidthMap: Record<string, string> = {
    narrow: '1024px',
    normal: '1280px',
    wide: '1440px',
    full: '100%',
  };

  const styleVariables = {
    '--sf-primary': theme.primaryColor || config.primaryColor || '#0f5fff',
    '--sf-accent': theme.accentColor || config.accentColor || '#00c896',
    '--sf-bg': theme.backgroundColor || '#ffffff',
    '--sf-surface': theme.surfaceColor || '#f8fafc',
    '--sf-text': theme.textColor || '#0f172a',
    '--sf-muted': theme.mutedColor || '#64748b',
    '--sf-radius': radiusMap[theme.borderRadius] || '8px',
    '--sf-btn-radius': buttonRadiusMap[theme.buttonStyle] || '8px',
    '--sf-max-width': maxWidthMap[theme.contentWidth] || '1280px',
  } as React.CSSProperties;

  // Font class application
  const headingFontClass =
    theme.fontHeading === 'space-grotesk'
      ? 'font-mono'
      : theme.fontHeading === 'outfit'
        ? 'font-sans'
        : 'font-sans';

  return (
    <div
      style={styleVariables}
      className={`min-h-screen flex flex-col text-[var(--sf-text)] bg-[var(--sf-bg)] ${headingFontClass} ${className}`}
    >
      {children}
    </div>
  );
}
