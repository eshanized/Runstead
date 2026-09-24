'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Sliders,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface SectionInspectorProps {
  sectionId: string;
  config: StorefrontConfig;
  onChange: (updated: StorefrontConfig) => void;
  onBack: () => void;
  currentPageSlug: string;
}

export function SectionInspector({
  sectionId,
  config,
  onChange,
  onBack,
  currentPageSlug,
}: SectionInspectorProps) {
  const isHomePage = !currentPageSlug || currentPageSlug === 'home';
  const targetPage = !isHomePage ? config.pages.find((p) => p.slug === currentPageSlug) : null;
  const sections = isHomePage
    ? config.sections || []
    : targetPage?.sections || [];

  const section = sections.find((s) => s.id === sectionId);

  if (!section) {
    return (
      <div className="p-4 text-center space-y-3">
        <p className="text-xs text-slate-500">Selected section not found.</p>
        <Button size="sm" variant="outline" onClick={onBack} className="text-xs">
          Return to Sections
        </Button>
      </div>
    );
  }

  const settings = section.settings || {};

  function updateSettings(partial: Record<string, any>) {
    if (!section) return;
    const updatedSection: StorefrontSection = {
      id: section.id,
      type: section.type,
      title: section.title,
      subtitle: section.subtitle,
      enabled: section.enabled,
      order: section.order,
      settings: {
        ...settings,
        ...partial,
      },
    };

    const updatedList = sections.map((s) => (s.id === sectionId ? updatedSection : s));

    if (isHomePage) {
      onChange({
        ...config,
        sections: updatedList,
        isDraftDirty: true,
      });
    } else if (targetPage) {
      const updatedPages = config.pages.map((p) =>
        p.slug === currentPageSlug ? { ...p, sections: updatedList } : p
      );
      onChange({
        ...config,
        pages: updatedPages,
        isDraftDirty: true,
      });
    }
  }

  function updateSectionMeta(partial: Partial<Omit<StorefrontSection, 'id' | 'type'>>) {
    if (!section) return;
    const updatedSection: StorefrontSection = {
      id: section.id,
      type: section.type,
      title: section.title,
      subtitle: section.subtitle,
      enabled: section.enabled,
      order: section.order,
      settings: section.settings,
      ...partial,
    };

    const updatedList = sections.map((s) => (s.id === sectionId ? updatedSection : s));

    if (isHomePage) {
      onChange({
        ...config,
        sections: updatedList,
        isDraftDirty: true,
      });
    } else if (targetPage) {
      const updatedPages = config.pages.map((p) =>
        p.slug === currentPageSlug ? { ...p, sections: updatedList } : p
      );
      onChange({
        ...config,
        pages: updatedPages,
        isDraftDirty: true,
      });
    }
  }

  return (
    <div className="space-y-5">
      {/* Inspector Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <Button
          size="sm"
          variant="ghost"
          onClick={onBack}
          className="h-7 px-2 text-xs gap-1 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
        <Badge variant="outline" className="text-[10px] uppercase font-mono">
          {section.type}
        </Badge>
      </div>

      {/* Basic Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-900">Section Visibility</Label>
          <Switch
            checked={section.enabled}
            onCheckedChange={(checked) => updateSectionMeta({ enabled: checked })}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-700">Internal Section Title</Label>
          <Input
            value={section.title}
            onChange={(e) => updateSectionMeta({ title: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Contextual Fields depending on Section Type */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Section Content
        </Label>

        {/* HERO SECTION */}
        {section.type === 'hero' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Eyebrow Tag</Label>
              <Input
                value={settings.eyebrow || ''}
                onChange={(e) => updateSettings({ eyebrow: e.target.value })}
                placeholder="High-Performance Cloud Infrastructure"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Headline</Label>
              <Input
                value={settings.headline || ''}
                onChange={(e) => updateSettings({ headline: e.target.value })}
                placeholder="Host smarter. Scale faster."
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Description</Label>
              <Textarea
                value={settings.description || ''}
                rows={3}
                onChange={(e) => updateSettings({ description: e.target.value })}
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Layout Variant</Label>
              <Select
                value={settings.layoutVariant || 'centered'}
                onValueChange={(val) => updateSettings({ layoutVariant: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="centered" className="text-xs">Centered Focus</SelectItem>
                  <SelectItem value="split" className="text-xs">Split Two-Column</SelectItem>
                  <SelectItem value="minimal" className="text-xs">Minimalist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500">Primary CTA Text</Label>
                <Input
                  value={settings.primaryCtaText || ''}
                  onChange={(e) => updateSettings({ primaryCtaText: e.target.value })}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500">Primary CTA Link</Label>
                <Input
                  value={settings.primaryCtaHref || ''}
                  onChange={(e) => updateSettings({ primaryCtaHref: e.target.value })}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500">Secondary CTA Text</Label>
                <Input
                  value={settings.secondaryCtaText || ''}
                  onChange={(e) => updateSettings({ secondaryCtaText: e.target.value })}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500">Secondary CTA Link</Label>
                <Input
                  value={settings.secondaryCtaHref || ''}
                  onChange={(e) => updateSettings({ secondaryCtaHref: e.target.value })}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* DOMAIN SEARCH SECTION */}
        {section.type === 'domain_search' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Headline</Label>
              <Input
                value={settings.headline || ''}
                onChange={(e) => updateSettings({ headline: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Subtitle</Label>
              <Input
                value={settings.subtitle || ''}
                onChange={(e) => updateSettings({ subtitle: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Search Box Placeholder</Label>
              <Input
                value={settings.inputPlaceholder || ''}
                onChange={(e) => updateSettings({ inputPlaceholder: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}

        {/* FEATURED PLANS */}
        {section.type === 'featured_plans' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Headline</Label>
              <Input
                value={settings.headline || ''}
                onChange={(e) => updateSettings({ headline: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Subtitle</Label>
              <Input
                value={settings.subtitle || ''}
                onChange={(e) => updateSettings({ subtitle: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-600">Show Monthly/Annual Cycle Switch</span>
              <Switch
                checked={settings.showBillingToggle ?? true}
                onCheckedChange={(checked) => updateSettings({ showBillingToggle: checked })}
              />
            </div>
          </div>
        )}

        {/* CUSTOM RICH TEXT */}
        {section.type === 'custom_rich_text' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Block Heading</Label>
              <Input
                value={settings.heading || ''}
                onChange={(e) => updateSettings({ heading: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Body Content</Label>
              <Textarea
                value={settings.body || ''}
                rows={4}
                onChange={(e) => updateSettings({ body: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Callout Highlight Box</Label>
              <Input
                value={settings.calloutText || ''}
                onChange={(e) => updateSettings({ calloutText: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500">Button Text</Label>
                <Input
                  value={settings.buttonText || ''}
                  onChange={(e) => updateSettings({ buttonText: e.target.value })}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500">Button Link</Label>
                <Input
                  value={settings.buttonHref || ''}
                  onChange={(e) => updateSettings({ buttonHref: e.target.value })}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* PROMOTIONAL BANNER */}
        {(section.type === 'promotional_banner' || section.type === 'announcement_banner') && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Badge Text</Label>
              <Input
                value={settings.badge || ''}
                onChange={(e) => updateSettings({ badge: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Headline</Label>
              <Input
                value={settings.headline || ''}
                onChange={(e) => updateSettings({ headline: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Description</Label>
              <Textarea
                value={settings.description || ''}
                rows={2}
                onChange={(e) => updateSettings({ description: e.target.value })}
                className="text-xs resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500">CTA Text</Label>
                <Input
                  value={settings.ctaText || ''}
                  onChange={(e) => updateSettings({ ctaText: e.target.value })}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500">CTA Destination</Label>
                <Input
                  value={settings.ctaHref || ''}
                  onChange={(e) => updateSettings({ ctaHref: e.target.value })}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* FAQ ACCORDION */}
        {section.type === 'faq_accordion' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Headline</Label>
              <Input
                value={settings.headline || ''}
                onChange={(e) => updateSettings({ headline: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Subtitle</Label>
              <Input
                value={settings.subtitle || ''}
                onChange={(e) => updateSettings({ subtitle: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-semibold text-slate-700">FAQ Items</Label>
              {(settings.faqs || []).map((faq: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-1.5 text-xs">
                  <Input
                    value={faq.q}
                    onChange={(e) => {
                      const updated = [...(settings.faqs || [])];
                      updated[idx] = { ...updated[idx], q: e.target.value };
                      updateSettings({ faqs: updated });
                    }}
                    placeholder="Question"
                    className="h-7 text-xs font-medium"
                  />
                  <Textarea
                    value={faq.a}
                    rows={2}
                    onChange={(e) => {
                      const updated = [...(settings.faqs || [])];
                      updated[idx] = { ...updated[idx], a: e.target.value };
                      updateSettings({ faqs: updated });
                    }}
                    placeholder="Answer"
                    className="text-xs resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (settings.faqs || []).filter((_: any, i: number) => i !== idx);
                      updateSettings({ faqs: updated });
                    }}
                    className="text-[10px] text-rose-600 hover:underline"
                  >
                    Remove Item
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const updated = [
                    ...(settings.faqs || []),
                    { q: 'New question', a: 'Answer description.' },
                  ];
                  updateSettings({ faqs: updated });
                }}
                className="w-full text-xs h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add FAQ Item
              </Button>
            </div>
          </div>
        )}

        {/* DEFAULT FALLBACK FOR OTHER SECTION TYPES */}
        {!['hero', 'domain_search', 'featured_plans', 'custom_rich_text', 'promotional_banner', 'announcement_banner', 'faq_accordion'].includes(
          section.type
        ) && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Section Headline</Label>
              <Input
                value={settings.headline || ''}
                onChange={(e) => updateSettings({ headline: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Subtitle / Description</Label>
              <Input
                value={settings.subtitle || ''}
                onChange={(e) => updateSettings({ subtitle: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
