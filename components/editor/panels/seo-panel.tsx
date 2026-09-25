'use client';

import { useState } from 'react';
import {
  Search,
  Globe,
  Share2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import type { StorefrontConfig, StorefrontSeoConfig } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SeoPanelProps {
  config: StorefrontConfig;
  onChange: (updated: StorefrontConfig) => void;
}

export function SeoPanel({ config, onChange }: SeoPanelProps) {
  const seo = config.seo || {
    pageTitle: `${config.businessName || 'CloudVista'} — High-Performance Cloud Hosting & Domains`,
    metaDescription: 'Deploy reliable shared hosting, scalable Cloud VPS, and secure domain names.',
    canonicalUrl: 'https://cloudvista.host',
    ogTitle: `${config.businessName || 'CloudVista'} — Cloud Infrastructure`,
    ogDescription: 'Instant automated provisioning, automated SSL, and NVMe-backed storage.',
    ogImageUrl: '',
    noIndex: true,
  };

  function updateSeo(partial: Partial<StorefrontSeoConfig>) {
    onChange({
      ...config,
      seo: {
        ...seo,
        ...partial,
      },
      isDraftDirty: true,
    });
  }

  return (
    <div className="space-y-6">
      {/* Search Engine Result Preview */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Search Snippet Preview
        </Label>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1 shadow-2xs font-sans">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <Globe className="h-3 w-3 text-slate-400" />
            <span className="truncate">{seo.canonicalUrl || 'https://your-storefront.host'}</span>
          </div>
          <h4 className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer truncate">
            {seo.pageTitle || `${config.businessName} Storefront`}
          </h4>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {seo.metaDescription || 'No description configured yet.'}
          </p>
        </div>
      </div>

      {/* Meta Tags */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-500" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Meta Information
          </Label>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium text-slate-700">Meta Title Tag</Label>
              <span className={`text-[10px] ${seo.pageTitle.length > 60 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                {seo.pageTitle.length} / 60
              </span>
            </div>
            <Input
              value={seo.pageTitle}
              maxLength={70}
              onChange={(e) => updateSeo({ pageTitle: e.target.value })}
              placeholder="e.g. Acme Hosting — Ultra-Fast Cloud VPS"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium text-slate-700">Meta Description</Label>
              <span className={`text-[10px] ${seo.metaDescription.length > 160 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                {seo.metaDescription.length} / 160
              </span>
            </div>
            <Textarea
              value={seo.metaDescription}
              maxLength={180}
              rows={3}
              onChange={(e) => updateSeo({ metaDescription: e.target.value })}
              placeholder="Summarize your hosting services and core value propositions..."
              className="text-xs resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Canonical Destination URL</Label>
            <Input
              value={seo.canonicalUrl || ''}
              onChange={(e) => updateSeo({ canonicalUrl: e.target.value })}
              placeholder="https://cloudvista.host"
              className="h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Open Graph Social Sharing */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-slate-500" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Open Graph (Social Cards)
          </Label>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Social Card Title</Label>
            <Input
              value={seo.ogTitle || ''}
              onChange={(e) => updateSeo({ ogTitle: e.target.value })}
              placeholder={seo.pageTitle}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Social Card Description</Label>
            <Input
              value={seo.ogDescription || ''}
              onChange={(e) => updateSeo({ ogDescription: e.target.value })}
              placeholder={seo.metaDescription}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Social Card Image URL</Label>
            <Input
              value={seo.ogImageUrl || ''}
              onChange={(e) => updateSeo({ ogImageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/... or /images/social-card.png"
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Search Engine Indexing Preference */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Indexing Controls
        </Label>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
          <div className="space-y-0.5 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900">Prevent Search Engine Indexing (noindex)</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-300 text-amber-700 bg-amber-50">
                Demo Default
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">
              Instructs search crawlers not to index this demonstration storefront in public web results.
            </p>
          </div>
          <Switch
            checked={seo.noIndex}
            onCheckedChange={(checked) => updateSeo({ noIndex: checked })}
          />
        </div>
      </div>
    </div>
  );
}
