'use client';

import { useState } from 'react';
import {
  Menu,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Bell,
  MousePointer,
  Sparkles,
} from 'lucide-react';
import type { StorefrontConfig, StorefrontHeaderConfig, StorefrontNavItem } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface HeaderPanelProps {
  config: StorefrontConfig;
  onChange: (updated: StorefrontConfig) => void;
}

export function HeaderPanel({ config, onChange }: HeaderPanelProps) {
  const header = config.header || {
    sticky: true,
    announcementBar: {
      enabled: true,
      text: 'Annual plans include 2 months free + automated SSL.',
      link: '/demo/storefront-preview/hosting',
      dismissible: true,
    },
    navItems: [],
    primaryCta: { text: 'Get Started', href: '/demo/storefront-preview/hosting', visible: true },
    secondaryCta: { text: 'Client Portal', href: '/demo/storefront-preview/client/login', visible: true },
  };

  const navItems = [...(header.navItems || [])].sort((a, b) => a.order - b.order);

  const [newLabel, setNewLabel] = useState('');
  const [newHref, setNewHref] = useState('');

  function updateHeader(partial: Partial<StorefrontHeaderConfig>) {
    onChange({
      ...config,
      header: {
        ...header,
        ...partial,
      },
      isDraftDirty: true,
    });
  }

  function handleAddNavItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim() || !newHref.trim()) {
      toast.error('Please specify both a link label and destination path.');
      return;
    }

    const newItem: StorefrontNavItem = {
      id: `nav_${Date.now()}`,
      label: newLabel.trim(),
      href: newHref.trim(),
      visible: true,
      order: navItems.length + 1,
    };

    updateHeader({ navItems: [...navItems, newItem] });
    setNewLabel('');
    setNewHref('');
    toast.success(`Added "${newItem.label}" navigation link`);
  }

  function handleToggleNav(id: string) {
    const updated = navItems.map((item) =>
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    updateHeader({ navItems: updated });
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const items = [...navItems];
    const prev = items[index - 1];
    const curr = items[index];
    const temp = prev.order;
    prev.order = curr.order;
    curr.order = temp;
    updateHeader({ navItems: items });
  }

  function handleMoveDown(index: number) {
    if (index >= navItems.length - 1) return;
    const items = [...navItems];
    const next = items[index + 1];
    const curr = items[index];
    const temp = next.order;
    next.order = curr.order;
    curr.order = temp;
    updateHeader({ navItems: items });
  }

  function handleDeleteNav(id: string) {
    const updated = navItems.filter((item) => item.id !== id);
    updateHeader({ navItems: updated });
    toast.success('Removed navigation item');
  }

  return (
    <div className="space-y-6">
      {/* Sticky Header Behavior */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
        <div className="space-y-0.5 pr-2">
          <span className="text-xs font-semibold text-slate-900">Sticky Header</span>
          <p className="text-[11px] text-slate-500">
            Keep navigation fixed at the top of the viewport when visitors scroll down the page.
          </p>
        </div>
        <Switch
          checked={header.sticky}
          onCheckedChange={(checked) => updateHeader({ sticky: checked })}
        />
      </div>

      {/* Announcement Bar */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-500" />
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Top Announcement Bar
            </Label>
          </div>
          <Switch
            checked={header.announcementBar?.enabled ?? false}
            onCheckedChange={(checked) =>
              updateHeader({
                announcementBar: {
                  ...header.announcementBar,
                  enabled: checked,
                },
              })
            }
          />
        </div>

        {header.announcementBar?.enabled && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Announcement Text</Label>
              <Input
                value={header.announcementBar.text}
                onChange={(e) =>
                  updateHeader({
                    announcementBar: {
                      ...header.announcementBar,
                      text: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Save 20% on all annual hosting plans this week"
                className="h-8 text-xs bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Link Destination (Optional)</Label>
              <Input
                value={header.announcementBar.link || ''}
                onChange={(e) =>
                  updateHeader({
                    announcementBar: {
                      ...header.announcementBar,
                      link: e.target.value,
                    },
                  })
                }
                placeholder="/demo/storefront-preview/hosting"
                className="h-8 text-xs bg-white"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-600">Visitor Dismissible</span>
              <Switch
                checked={header.announcementBar.dismissible}
                onCheckedChange={(checked) =>
                  updateHeader({
                    announcementBar: {
                      ...header.announcementBar,
                      dismissible: checked,
                    },
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Menu className="h-4 w-4 text-slate-500" />
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Navigation Menu Items
            </Label>
          </div>
          <Badge variant="outline" className="text-[10px] text-slate-500">
            {navItems.filter((i) => i.visible).length} Visible
          </Badge>
        </div>

        <div className="space-y-1.5">
          {navItems.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors ${
                item.visible
                  ? 'border-slate-200 bg-white'
                  : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              <div className="min-w-0 flex-1 pr-2">
                <span className="font-medium text-slate-900 block truncate">{item.label}</span>
                <span className="text-[10px] text-slate-400 block truncate">{item.href}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-slate-400 hover:text-slate-700"
                  disabled={index === 0}
                  onClick={() => handleMoveUp(index)}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-slate-400 hover:text-slate-700"
                  disabled={index === navItems.length - 1}
                  onClick={() => handleMoveDown(index)}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-slate-400 hover:text-slate-700"
                  onClick={() => handleToggleNav(item.id)}
                >
                  {item.visible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-amber-600" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-slate-400 hover:text-rose-600"
                  onClick={() => handleDeleteNav(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Nav Item Inline Form */}
        <form onSubmit={handleAddNavItem} className="rounded-xl border border-dashed border-slate-200 p-3 space-y-2.5">
          <Label className="text-xs font-medium text-slate-700">Add Navigation Link</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Cloud VPS)"
              className="h-8 text-xs"
            />
            <Input
              value={newHref}
              onChange={(e) => setNewHref(e.target.value)}
              placeholder="Path (e.g. /demo/storefront-preview/vps)"
              className="h-8 text-xs"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="w-full h-7 text-xs gap-1">
            <Plus className="h-3 w-3" />
            Add Menu Item
          </Button>
        </form>
      </div>

      {/* Action CTAs */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <MousePointer className="h-4 w-4 text-slate-500" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Header Call-to-Action Buttons
          </Label>
        </div>

        {/* Primary CTA */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900">Primary CTA Button</span>
            <Switch
              checked={header.primaryCta?.visible ?? true}
              onCheckedChange={(checked) =>
                updateHeader({
                  primaryCta: { ...header.primaryCta, visible: checked },
                })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-500">Button Text</Label>
              <Input
                value={header.primaryCta?.text || ''}
                onChange={(e) =>
                  updateHeader({
                    primaryCta: { ...header.primaryCta, text: e.target.value },
                  })
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-500">Target Path</Label>
              <Input
                value={header.primaryCta?.href || ''}
                onChange={(e) =>
                  updateHeader({
                    primaryCta: { ...header.primaryCta, href: e.target.value },
                  })
                }
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Secondary CTA */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900">Secondary CTA Button</span>
            <Switch
              checked={header.secondaryCta?.visible ?? true}
              onCheckedChange={(checked) =>
                updateHeader({
                  secondaryCta: { ...header.secondaryCta, visible: checked },
                })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-500">Button Text</Label>
              <Input
                value={header.secondaryCta?.text || ''}
                onChange={(e) =>
                  updateHeader({
                    secondaryCta: { ...header.secondaryCta, text: e.target.value },
                  })
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-500">Target Path</Label>
              <Input
                value={header.secondaryCta?.href || ''}
                onChange={(e) =>
                  updateHeader({
                    secondaryCta: { ...header.secondaryCta, href: e.target.value },
                  })
                }
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
