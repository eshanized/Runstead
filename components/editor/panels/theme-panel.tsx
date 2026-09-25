'use client';

import { useState } from 'react';
import {
  Palette,
  Check,
  Type,
  Maximize2,
  Box,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';
import type {
  StorefrontConfig,
  StorefrontThemeConfig,
  ThemePresetId,
  FontHeading,
  FontBody,
  BorderRadiusPreset,
  ButtonStylePreset,
  ContentWidthPreset,
  SpacingPreset,
} from '@/lib/demo/types';
import { themePresets, sanitizeColor } from '@/lib/demo/storefront-presets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface ThemePanelProps {
  config: StorefrontConfig;
  onChange: (updated: StorefrontConfig) => void;
}

const PRESET_DESCRIPTIONS: Record<
  ThemePresetId,
  { name: string; tag: string; description: string; colors: string[] }
> = {
  'modern-cloud': {
    name: 'Modern Cloud',
    tag: 'Standard SaaS',
    description: 'Clean high-contrast tech aesthetic with vivid blue primaries and emerald accents.',
    colors: ['#0f5fff', '#00c896', '#ffffff', '#0f172a'],
  },
  'minimal-studio': {
    name: 'Minimal Studio',
    tag: 'Editorial & Monospace',
    description: 'Stark high-end monochrome minimalism with sharp zero-radius edges and warm accenting.',
    colors: ['#0f172a', '#f97316', '#ffffff', '#475569'],
  },
  'enterprise-infra': {
    name: 'Enterprise Infrastructure',
    tag: 'Corporate & Data Center',
    description: 'Deep navy and sky blue tones optimized for enterprise hosting and SLA reassurance.',
    colors: ['#1e3a8a', '#0284c7', '#f8fafc', '#0f172a'],
  },
  'developer-cloud': {
    name: 'Developer Cloud',
    tag: 'Dark Terminal',
    description: 'Dark-mode focused terminal look with neon emerald and purple highlights, monospace typography.',
    colors: ['#10b981', '#8b5cf6', '#090d16', '#f8fafc'],
  },
  'commerce-focus': {
    name: 'Commerce Focus',
    tag: 'High Conversion',
    description: 'Vibrant indigo and pink accents with rounded pill buttons engineered for e-commerce checkout flow.',
    colors: ['#6366f1', '#ec4899', '#faf5ff', '#18181b'],
  },
};

const HEADING_FONTS: Array<{ id: FontHeading; label: string; sample: string }> = [
  { id: 'plus-jakarta', label: 'Plus Jakarta Sans', sample: 'Modern & Geometrical' },
  { id: 'inter', label: 'Inter', sample: 'Neutral & High Legibility' },
  { id: 'space-grotesk', label: 'Space Grotesk', sample: 'Technical & Angular' },
  { id: 'outfit', label: 'Outfit', sample: 'Friendly & Contemporary' },
  { id: 'fira-code', label: 'Fira Code', sample: 'Developer Monospace' },
];

const BODY_FONTS: Array<{ id: FontBody; label: string }> = [
  { id: 'inter', label: 'Inter (Default System Body)' },
  { id: 'plus-jakarta', label: 'Plus Jakarta Sans' },
  { id: 'roboto', label: 'Roboto' },
  { id: 'fira-code', label: 'Fira Code (Code Monospace)' },
  { id: 'system', label: 'System Native (San Francisco / Segoe UI)' },
];

const BORDER_RADIUS_OPTIONS: Array<{ id: BorderRadiusPreset; label: string; previewClass: string }> = [
  { id: 'none', label: 'Sharp (0px)', previewClass: 'rounded-none' },
  { id: 'sm', label: 'Small (4px)', previewClass: 'rounded-sm' },
  { id: 'md', label: 'Medium (8px)', previewClass: 'rounded-md' },
  { id: 'lg', label: 'Large (12px)', previewClass: 'rounded-lg' },
  { id: 'full', label: 'Pill (9999px)', previewClass: 'rounded-full' },
];

const BUTTON_STYLE_OPTIONS: Array<{ id: ButtonStylePreset; label: string }> = [
  { id: 'rounded', label: 'Standard Rounded' },
  { id: 'pill', label: 'Pill Shape' },
  { id: 'square', label: 'Geometric Square' },
  { id: 'outline-fill', label: 'Outline with Soft Fill' },
];

const SPACING_OPTIONS: Array<{ id: SpacingPreset; label: string }> = [
  { id: 'compact', label: 'Compact (High Information Density)' },
  { id: 'comfortable', label: 'Comfortable (Balanced Spacing)' },
  { id: 'spacious', label: 'Spacious (Breathing Room & Large Sections)' },
];

const CONTENT_WIDTH_OPTIONS: Array<{ id: ContentWidthPreset; label: string }> = [
  { id: 'narrow', label: 'Narrow (Max 1024px)' },
  { id: 'normal', label: 'Standard (Max 1280px)' },
  { id: 'wide', label: 'Wide (Max 1536px)' },
  { id: 'full', label: 'Full Edge-to-Edge' },
];

export function ThemePanel({ config, onChange }: ThemePanelProps) {
  const currentTheme = config.theme || themePresets['modern-cloud'];

  function handleSelectPreset(presetId: ThemePresetId) {
    const preset = themePresets[presetId];
    if (!preset) return;

    onChange({
      ...config,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      theme: {
        ...preset,
      },
      isDraftDirty: true,
    });
    toast.success(`Applied "${PRESET_DESCRIPTIONS[presetId].name}" theme preset`);
  }

  function handleThemeChange(partial: Partial<StorefrontThemeConfig>) {
    const updatedTheme: StorefrontThemeConfig = {
      ...currentTheme,
      ...partial,
    };

    const updatedConfig: StorefrontConfig = {
      ...config,
      theme: updatedTheme,
      primaryColor: updatedTheme.primaryColor,
      accentColor: updatedTheme.accentColor,
      isDraftDirty: true,
    };

    onChange(updatedConfig);
  }

  function handleColorChange(key: 'primaryColor' | 'accentColor' | 'backgroundColor' | 'textColor', value: string) {
    const clean = sanitizeColor(value, (currentTheme as any)[key]);
    handleThemeChange({ [key]: clean } as any);
  }

  return (
    <div className="space-y-6">
      {/* Theme Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Theme Presets
          </Label>
          <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50">
            5 Curated Designs
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {(Object.keys(themePresets) as ThemePresetId[]).map((id) => {
            const meta = PRESET_DESCRIPTIONS[id];
            const isSelected = currentTheme.preset === id;

            return (
              <div
                key={id}
                onClick={() => handleSelectPreset(id)}
                className={`relative flex flex-col gap-2 rounded-xl border p-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{meta.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-slate-200 text-slate-600">
                      {meta.tag}
                    </Badge>
                  </div>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">{meta.description}</p>

                {/* Color swatches */}
                <div className="flex items-center gap-1.5 pt-1">
                  {meta.colors.map((c, i) => (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-slate-500" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Typography Pairing
          </Label>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Heading Font</Label>
            <Select
              value={currentTheme.fontHeading}
              onValueChange={(val) => handleThemeChange({ fontHeading: val as FontHeading })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select heading font" />
              </SelectTrigger>
              <SelectContent>
                {HEADING_FONTS.map((font) => (
                  <SelectItem key={font.id} value={font.id} className="text-xs">
                    <span className="font-semibold">{font.label}</span>{' '}
                    <span className="text-slate-400 text-[10px]">({font.sample})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Body Font</Label>
            <Select
              value={currentTheme.fontBody}
              onValueChange={(val) => handleThemeChange({ fontBody: val as FontBody })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select body font" />
              </SelectTrigger>
              <SelectContent>
                {BODY_FONTS.map((font) => (
                  <SelectItem key={font.id} value={font.id} className="text-xs">
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Component Styles */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-slate-500" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Component Styling
          </Label>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Corner Radius Preset</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {BORDER_RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleThemeChange({ borderRadius: opt.id })}
                  className={`flex flex-col items-center gap-1.5 p-2 text-center rounded-lg border text-[10px] transition-all ${
                    currentTheme.borderRadius === opt.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`h-5 w-5 border-2 border-current ${opt.previewClass}`}
                  />
                  <span>{opt.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Button Appearance</Label>
            <Select
              value={currentTheme.buttonStyle}
              onValueChange={(val) => handleThemeChange({ buttonStyle: val as ButtonStylePreset })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select button style" />
              </SelectTrigger>
              <SelectContent>
                {BUTTON_STYLE_OPTIONS.map((style) => (
                  <SelectItem key={style.id} value={style.id} className="text-xs">
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Layout & Spacing */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Maximize2 className="h-4 w-4 text-slate-500" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Layout & Spacing
          </Label>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Content Max-Width</Label>
            <Select
              value={currentTheme.contentWidth}
              onValueChange={(val) => handleThemeChange({ contentWidth: val as ContentWidthPreset })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select width preset" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_WIDTH_OPTIONS.map((width) => (
                  <SelectItem key={width.id} value={width.id} className="text-xs">
                    {width.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Section Vertical Spacing</Label>
            <Select
              value={currentTheme.spacing}
              onValueChange={(val) => handleThemeChange({ spacing: val as SpacingPreset })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select spacing preset" />
              </SelectTrigger>
              <SelectContent>
                {SPACING_OPTIONS.map((spacing) => (
                  <SelectItem key={spacing.id} value={spacing.id} className="text-xs">
                    {spacing.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Color Overrides */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-slate-500" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Brand Color Overrides
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-slate-600">Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentTheme.primaryColor}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0.5"
              />
              <Input
                value={currentTheme.primaryColor}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-slate-600">Accent Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentTheme.accentColor}
                onChange={(e) => handleColorChange('accentColor', e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0.5"
              />
              <Input
                value={currentTheme.accentColor}
                onChange={(e) => handleColorChange('accentColor', e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
