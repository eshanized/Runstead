'use client';

import { useState } from 'react';
import {
  LayoutTemplate,
  Plus,
  Trash2,
  Share2,
  Phone,
  Link as LinkIcon,
  Twitter,
  Github,
  Linkedin,
  Disc as Discord,
} from 'lucide-react';
import type { StorefrontConfig, StorefrontFooterConfig, StorefrontFooterColumn } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface FooterPanelProps {
  config: StorefrontConfig;
  onChange: (updated: StorefrontConfig) => void;
}

export function FooterPanel({ config, onChange }: FooterPanelProps) {
  const footer = config.footer || {
    layout: 'columns',
    showContact: true,
    showSocials: true,
    socialLinks: [
      { platform: 'twitter', url: 'https://twitter.com', enabled: true },
      { platform: 'github', url: 'https://github.com', enabled: true },
      { platform: 'linkedin', url: 'https://linkedin.com', enabled: true },
      { platform: 'discord', url: 'https://discord.com', enabled: false },
    ],
    columns: [],
  };

  const [newColTitle, setNewColTitle] = useState('');

  function updateFooter(partial: Partial<StorefrontFooterConfig>) {
    onChange({
      ...config,
      footer: {
        ...footer,
        ...partial,
      },
      isDraftDirty: true,
    });
  }

  function handleAddColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!newColTitle.trim()) return;

    const newCol: StorefrontFooterColumn = {
      id: `col_${Date.now()}`,
      title: newColTitle.trim(),
      links: [],
    };

    updateFooter({ columns: [...footer.columns, newCol] });
    setNewColTitle('');
    toast.success(`Added footer column "${newCol.title}"`);
  }

  function handleDeleteColumn(colId: string) {
    updateFooter({ columns: footer.columns.filter((c) => c.id !== colId) });
    toast.success('Column removed');
  }

  function handleAddLinkToColumn(colId: string, label: string, href: string) {
    if (!label.trim() || !href.trim()) return;
    const updated = footer.columns.map((c) => {
      if (c.id !== colId) return c;
      return {
        ...c,
        links: [...c.links, { label: label.trim(), href: href.trim() }],
      };
    });
    updateFooter({ columns: updated });
    toast.success(`Added link to column`);
  }

  function handleRemoveLink(colId: string, linkIndex: number) {
    const updated = footer.columns.map((c) => {
      if (c.id !== colId) return c;
      return {
        ...c,
        links: c.links.filter((_, idx) => idx !== linkIndex),
      };
    });
    updateFooter({ columns: updated });
  }

  function handleUpdateSocial(platform: 'twitter' | 'github' | 'linkedin' | 'discord', url: string, enabled: boolean) {
    const updated = footer.socialLinks.map((s) =>
      s.platform === platform ? { ...s, url, enabled } : s
    );
    updateFooter({ socialLinks: updated });
  }

  return (
    <div className="space-y-6">
      {/* Footer Layout Option */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-slate-500" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Footer Layout Style
          </Label>
        </div>

        <Select
          value={footer.layout}
          onValueChange={(val) => updateFooter({ layout: val as 'simple' | 'columns' | 'centered' })}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Select footer layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="columns" className="text-xs">
              Multi-Column Navigation (Recommended for Hosting)
            </SelectItem>
            <SelectItem value="simple" className="text-xs">
              Simple Stacked Horizontal
            </SelectItem>
            <SelectItem value="centered" className="text-xs">
              Centered Minimalist
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contact & Socials Toggles */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Footer Elements
        </Label>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-900">Show Contact Details</span>
            <p className="text-[11px] text-slate-500">Display email and telephone hotline in footer brand block.</p>
          </div>
          <Switch
            checked={footer.showContact}
            onCheckedChange={(checked) => updateFooter({ showContact: checked })}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-900">Show Social Media Links</span>
            <p className="text-[11px] text-slate-500">Display social platform badges in footer.</p>
          </div>
          <Switch
            checked={footer.showSocials}
            onCheckedChange={(checked) => updateFooter({ showSocials: checked })}
          />
        </div>
      </div>

      {/* Social Links Config */}
      {footer.showSocials && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Social Profiles
          </Label>

          <div className="space-y-2">
            {footer.socialLinks.map((social) => (
              <div
                key={social.platform}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2"
              >
                <Switch
                  checked={social.enabled}
                  onCheckedChange={(checked) =>
                    handleUpdateSocial(social.platform, social.url, checked)
                  }
                />
                <span className="text-xs font-medium capitalize w-20 text-slate-700">
                  {social.platform}
                </span>
                <Input
                  value={social.url}
                  disabled={!social.enabled}
                  onChange={(e) =>
                    handleUpdateSocial(social.platform, e.target.value, social.enabled)
                  }
                  placeholder={`https://${social.platform}.com/...`}
                  className="h-7 text-xs flex-1"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Navigation Columns */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Footer Columns ({footer.columns.length})
          </Label>
        </div>

        <div className="space-y-3">
          {footer.columns.map((column) => (
            <ColumnEditorItem
              key={column.id}
              column={column}
              onDelete={() => handleDeleteColumn(column.id)}
              onAddLink={(label, href) => handleAddLinkToColumn(column.id, label, href)}
              onRemoveLink={(idx) => handleRemoveLink(column.id, idx)}
            />
          ))}
        </div>

        {/* Add Column Form */}
        <form onSubmit={handleAddColumn} className="flex gap-2 pt-1">
          <Input
            value={newColTitle}
            onChange={(e) => setNewColTitle(e.target.value)}
            placeholder="New Column Title (e.g. Products)"
            className="h-8 text-xs"
          />
          <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs shrink-0">
            <Plus className="h-3 w-3 mr-1" />
            Add Column
          </Button>
        </form>
      </div>
    </div>
  );
}

function ColumnEditorItem({
  column,
  onDelete,
  onAddLink,
  onRemoveLink,
}: {
  column: StorefrontFooterColumn;
  onDelete: () => void;
  onAddLink: (label: string, href: string) => void;
  onRemoveLink: (index: number) => void;
}) {
  const [label, setLabel] = useState('');
  const [href, setHref] = useState('');

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-900">{column.title}</h4>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-slate-400 hover:text-rose-600"
          onClick={onDelete}
          title="Remove Column"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Links List */}
      <div className="space-y-1">
        {column.links.map((link, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-[11px]"
          >
            <span className="font-medium text-slate-700 truncate">{link.label}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                {link.href}
              </span>
              <button
                type="button"
                onClick={() => onRemoveLink(idx)}
                className="text-slate-400 hover:text-rose-600 ml-1"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Link to Column */}
      <div className="flex gap-1.5 pt-1">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Link text"
          className="h-7 text-[11px] flex-1"
        />
        <Input
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="/destination"
          className="h-7 text-[11px] flex-1"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            if (label && href) {
              onAddLink(label, href);
              setLabel('');
              setHref('');
            }
          }}
          className="h-7 text-[11px] px-2"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
