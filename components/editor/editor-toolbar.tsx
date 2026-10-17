'use client';

import React from 'react';
import Link from 'next/link';
import {
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Globe,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Check,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import type { StorefrontConfig } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

interface EditorToolbarProps {
  config: StorefrontConfig;
  currentPageSlug: string;
  onPageChange: (slug: string) => void;
  viewport: ViewportMode;
  onViewportChange: (viewport: ViewportMode) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onRevert: () => void;
}

export function EditorToolbar({
  config,
  currentPageSlug,
  onPageChange,
  viewport,
  onViewportChange,
  onSaveDraft,
  onPublish,
  onRevert,
}: EditorToolbarProps) {
  const isDirty = config.isDraftDirty;
  const pages = config.pages || [];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
      {/* Left: Brand & Page Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs shadow-2xs"
            style={{ backgroundColor: config.primaryColor || '#0f5fff' }}
          >
            {config.branding?.logoText || config.logoText || 'CV'}
          </div>
          <div className="hidden sm:block">
            <h2 className="text-xs font-bold text-slate-900 leading-tight">
              {config.branding?.businessName || config.businessName || 'Storefront Builder'}
            </h2>
            <p className="text-[10px] text-slate-500 font-medium">Storefront Experience 2.0</p>
          </div>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 hidden md:inline">Page:</span>
          <Select value={currentPageSlug || 'home'} onValueChange={onPageChange}>
            <SelectTrigger className="h-8 text-xs min-w-[140px] bg-slate-50 border-slate-200 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pages.map((p) => (
                <SelectItem key={p.slug} value={p.slug} className="text-xs">
                  {p.title} {p.type === 'custom' && '(Custom)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Center: Viewport Mode Switcher */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onViewportChange('desktop')}
          className={`h-7 px-2.5 text-xs gap-1.5 ${
            viewport === 'desktop'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Desktop (100% width)"
        >
          <Monitor className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Desktop</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onViewportChange('tablet')}
          className={`h-7 px-2.5 text-xs gap-1.5 ${
            viewport === 'tablet'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Tablet (768px width)"
        >
          <Tablet className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Tablet</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onViewportChange('mobile')}
          className={`h-7 px-2.5 text-xs gap-1.5 ${
            viewport === 'mobile'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Mobile (375px width)"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Mobile</span>
        </Button>
      </div>

      {/* Right: State Indicators & Actions */}
      <div className="flex items-center gap-2">
        {isDirty ? (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] gap-1 hover:bg-amber-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Unpublished Changes
          </Badge>
        ) : (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1 hover:bg-emerald-50">
            <Check className="h-3 w-3 stroke-[3]" />
            Published
          </Badge>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={onSaveDraft}
          className="h-8 text-xs gap-1.5 font-medium border-slate-300"
        >
          <Save className="h-3.5 w-3.5 text-slate-600" />
          <span className="hidden sm:inline">Save Draft</span>
        </Button>

        <Button
          size="sm"
          onClick={onPublish}
          className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
        >
          <Globe className="h-3.5 w-3.5" />
          Publish to Live
        </Button>

        <Button
          asChild
          size="sm"
          variant="ghost"
          className="h-8 text-xs gap-1 text-slate-600 hover:text-slate-900"
        >
          <Link href="/storefront" target="_blank">
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Open Live Storefront</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
