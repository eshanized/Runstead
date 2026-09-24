'use client';

import { useState, useRef } from 'react';
import {
  Building2,
  Upload,
  Trash2,
  Image as ImageIcon,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  Check,
} from 'lucide-react';
import type { StorefrontConfig, StorefrontBrandingConfig } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface BrandingPanelProps {
  config: StorefrontConfig;
  onChange: (updated: StorefrontConfig) => void;
}

const MAX_IMAGE_SIZE_BYTES = 512 * 1024; // 512 KB to prevent local storage quota saturation

export function BrandingPanel({ config, onChange }: BrandingPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const branding = config.branding || {
    businessName: config.businessName || 'CloudVista Hosting',
    legalName: 'CloudVista Hosting LLC',
    tagline: config.tagline || 'Reliable hosting for growing businesses',
    email: config.email || 'sales@cloudvista.host',
    phone: config.phone || '+1 888 555 0100',
    logoUrl: null,
    logoText: config.logoText || 'CV',
    logoAlt: 'Company Logo',
    faviconUrl: null,
    showPlatformAttribution: false,
    copyrightText: `© ${new Date().getFullYear()} CloudVista Hosting LLC. All rights reserved.`,
  };

  function updateBranding(partial: Partial<StorefrontBrandingConfig>) {
    const updatedBranding: StorefrontBrandingConfig = {
      ...branding,
      ...partial,
    };

    const updatedConfig: StorefrontConfig = {
      ...config,
      branding: updatedBranding,
      // Maintain top-level compatibility
      businessName: updatedBranding.businessName,
      tagline: updatedBranding.tagline,
      email: updatedBranding.email,
      phone: updatedBranding.phone,
      logoText: updatedBranding.logoText,
      isDraftDirty: true,
    };

    onChange(updatedConfig);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid image type. Please upload a PNG, JPEG, SVG, or WebP file.');
      return;
    }

    // Validate size
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`Image is too large (${Math.round(file.size / 1024)}KB). Maximum permitted size is 512KB for browser storage.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      try {
        updateBranding({ logoUrl: dataUrl });
        toast.success('Logo uploaded successfully');
      } catch (err) {
        toast.error('Could not save logo to demo storage. File might exceed available quota.');
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read image file.');
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleRemoveLogo() {
    updateBranding({ logoUrl: null });
    toast.info('Logo removed, falling back to text monogram');
  }

  return (
    <div className="space-y-6">
      {/* Identity */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-500" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Business Identity
          </Label>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Display Business Name *</Label>
            <Input
              value={branding.businessName}
              onChange={(e) => updateBranding({ businessName: e.target.value })}
              placeholder="e.g. Apex Hosting Co."
              className="h-9 text-xs"
            />
            <p className="text-[10px] text-slate-500">Shown in header, hero, and customer correspondence.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Legal Registered Name</Label>
            <Input
              value={branding.legalName}
              onChange={(e) => updateBranding({ legalName: e.target.value })}
              placeholder="e.g. Apex Cloud Infrastructure LLC"
              className="h-9 text-xs"
            />
            <p className="text-[10px] text-slate-500">Used for legal disclaimers, invoices, and terms.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Tagline / Mission</Label>
            <Input
              value={branding.tagline}
              onChange={(e) => updateBranding({ tagline: e.target.value })}
              placeholder="e.g. Ultra-fast NVMe cloud hosting with 99.9% uptime architecture"
              className="h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Logo & Visual Mark */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-slate-500" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Logo & Visual Mark
          </Label>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <Label className="text-xs font-medium text-slate-700 block">Current Logo</Label>
            {branding.logoUrl ? (
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-28 items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
                  <img
                    src={branding.logoUrl}
                    alt={branding.logoAlt || 'Storefront logo'}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="space-y-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    Replace
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveLogo}
                    className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 ml-2"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-sm shadow-xs"
                  style={{ backgroundColor: config.primaryColor || '#0f5fff' }}
                >
                  {branding.logoText || 'CV'}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">Text Monogram Fallback</p>
                  <p className="text-[10px] text-slate-500">
                    Using &ldquo;{branding.logoText || 'CV'}&rdquo; as badge icon. Upload an image to replace it.
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoUpload}
              className="hidden"
            />

            {!branding.logoUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-8 text-xs gap-1.5 border-dashed"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                Upload Brand Logo (PNG, SVG, WebP max 512KB)
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Logo Text Monogram</Label>
              <Input
                value={branding.logoText}
                maxLength={4}
                onChange={(e) => updateBranding({ logoText: e.target.value.toUpperCase() })}
                placeholder="CV"
                className="h-9 text-xs font-mono uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Logo Alt Description</Label>
              <Input
                value={branding.logoAlt || ''}
                onChange={(e) => updateBranding({ logoAlt: e.target.value })}
                placeholder="Company Logo"
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Channels */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Public Contact Information
        </Label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Support / Sales Email</Label>
            <Input
              value={branding.email}
              onChange={(e) => updateBranding({ email: e.target.value })}
              placeholder="sales@example.host"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Phone Hotline</Label>
            <Input
              value={branding.phone}
              onChange={(e) => updateBranding({ phone: e.target.value })}
              placeholder="+1 888 555 0100"
              className="h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* White-Label Settings */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          White-Label & Legal Settings
        </Label>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-900">Show &ldquo;Powered by Runstead&rdquo;</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-slate-200 text-slate-500">
                  White-label
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500">
                When disabled, removes all vendor attribution from the footer and customer portal for true white-label hosting.
              </p>
            </div>
            <Switch
              checked={branding.showPlatformAttribution}
              onCheckedChange={(checked) => updateBranding({ showPlatformAttribution: checked })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Copyright Notice</Label>
            <Input
              value={branding.copyrightText}
              onChange={(e) => updateBranding({ copyrightText: e.target.value })}
              className="h-9 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
