'use client';

import { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Globe,
  Settings2,
  ExternalLink,
} from 'lucide-react';
import type { StorefrontConfig, StorefrontPageConfig } from '@/lib/demo/types';
import { isValidCustomSlug } from '@/lib/demo/storefront-presets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PagesPanelProps {
  config: StorefrontConfig;
  onChange: (updated: StorefrontConfig) => void;
  selectedPageSlug: string;
  onSelectPage: (slug: string) => void;
}

export function PagesPanel({ config, onChange, selectedPageSlug, onSelectPage }: PagesPanelProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const [editingPage, setEditingPage] = useState<StorefrontPageConfig | null>(null);

  function handleCreatePage(e: React.FormEvent) {
    e.preventDefault();
    const slugCheck = isValidCustomSlug(newSlug);
    if (!slugCheck.valid) {
      toast.error(slugCheck.error || 'Invalid page slug.');
      return;
    }

    if (config.pages.some((p) => p.slug.toLowerCase() === newSlug.toLowerCase())) {
      toast.error(`A page with slug "${newSlug}" already exists.`);
      return;
    }

    const newPage: StorefrontPageConfig = {
      id: `page_${Date.now()}`,
      slug: newSlug.trim().toLowerCase(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      type: 'custom',
      visibleInNav: true,
      navOrder: config.pages.length + 1,
      seo: {
        title: `${newTitle.trim()} | ${config.businessName}`,
        description: newDesc.trim(),
      },
      customContent: {
        leadParagraph: `Welcome to ${newTitle.trim()}. We provide specialized hosting solutions tailored to your unique requirements.`,
        blocks: [
          {
            heading: 'Overview & Services',
            body: 'Configure this custom page content directly from the Runstead Storefront Builder.',
          },
        ],
      },
    };

    const updatedPages = [...config.pages, newPage];

    // Also add to header nav items if visible
    const updatedNav = [
      ...config.header.navItems,
      {
        id: `nav_${newPage.id}`,
        label: newPage.title,
        href: `/storefront/pages/${newPage.slug}`,
        visible: true,
        order: config.header.navItems.length + 1,
      },
    ];

    onChange({
      ...config,
      pages: updatedPages,
      header: {
        ...config.header,
        navItems: updatedNav,
      },
    });

    setAddModalOpen(false);
    setNewTitle('');
    setNewSlug('');
    setNewDesc('');
    onSelectPage(newPage.slug);
    toast.success(`Custom page "${newPage.title}" created!`);
  }

  function handleToggleNav(pageId: string) {
    const updated = config.pages.map((p) =>
      p.id === pageId ? { ...p, visibleInNav: !p.visibleInNav } : p
    );
    onChange({ ...config, pages: updated });
  }

  function handleMovePage(index: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= config.pages.length) return;

    const newPages = [...config.pages];
    const temp = newPages[index];
    newPages[index] = newPages[targetIdx];
    newPages[targetIdx] = temp;

    // Recalculate navOrder
    newPages.forEach((p, idx) => {
      p.navOrder = idx + 1;
    });

    onChange({ ...config, pages: newPages });
  }

  function handleDeleteCustomPage(pageId: string) {
    const page = config.pages.find((p) => p.id === pageId);
    if (!page || page.type === 'built_in') {
      toast.error('Built-in system pages cannot be deleted.');
      return;
    }

    const updated = config.pages.filter((p) => p.id !== pageId);
    const updatedNav = config.header.navItems.filter(
      (item) => !item.href.includes(`/pages/${page.slug}`)
    );

    onChange({
      ...config,
      pages: updatedPages(updated),
      header: {
        ...config.header,
        navItems: updatedNav,
      },
    });

    if (selectedPageSlug === page.slug) {
      onSelectPage('home');
    }
    toast.info(`Page "${page.title}" removed.`);
  }

  function updatedPages(pages: StorefrontPageConfig[]) {
    return pages.map((p, idx) => ({ ...p, navOrder: idx + 1 }));
  }

  function handleSavePageSeo() {
    if (!editingPage) return;
    const updated = config.pages.map((p) => (p.id === editingPage.id ? editingPage : p));
    onChange({ ...config, pages: updated });
    setEditingPage(null);
    toast.success(`Page SEO updated.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Storefront Pages</h3>
          <p className="text-[11px] text-slate-400">Manage built-in routes and create dynamic custom pages.</p>
        </div>
        <Button
          size="sm"
          onClick={() => setAddModalOpen(true)}
          className="h-7 text-xs bg-slate-900 text-white gap-1"
        >
          <Plus className="h-3 w-3" /> Add Page
        </Button>
      </div>

      <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
        {config.pages.map((page, idx) => {
          const isSelected = selectedPageSlug === page.slug;
          return (
            <div
              key={page.id}
              className={`p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div
                className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                onClick={() => onSelectPage(page.slug)}
              >
                <FileText className={`h-4 w-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="truncate">
                  <span className="font-semibold text-slate-900 block truncate">{page.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    /{page.type === 'custom' ? `pages/${page.slug}` : page.slug === 'home' ? '' : page.slug}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {page.type === 'custom' ? (
                  <Badge variant="outline" className="text-[9px] px-1 h-4 border-purple-300 text-purple-700 bg-purple-50">
                    Custom
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[9px] px-1 h-4 text-slate-500">
                    Core
                  </Badge>
                )}

                <button
                  type="button"
                  title="Page SEO"
                  onClick={() => setEditingPage(page)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  title="Move Up"
                  disabled={idx === 0}
                  onClick={() => handleMovePage(idx, 'up')}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-100"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Move Down"
                  disabled={idx === config.pages.length - 1}
                  onClick={() => handleMovePage(idx, 'down')}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-100"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>

                {page.type === 'custom' && (
                  <button
                    type="button"
                    title="Delete Page"
                    onClick={() => handleDeleteCustomPage(page.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Page Dialog */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Add Custom Storefront Page</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create a new content page backed by the demo configuration engine.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePage} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="pageTitle">Page Title</Label>
              <Input
                id="pageTitle"
                placeholder="e.g. Enterprise Solutions"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (!newSlug) {
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                  }
                }}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pageSlug">URL Slug (/pages/...)</Label>
              <Input
                id="pageSlug"
                placeholder="e.g. enterprise-solutions"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase())}
                className="text-xs h-9 font-mono"
                required
              />
              <p className="text-[10px] text-slate-400">Cannot collide with reserved built-in route names.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pageDesc">Brief Description</Label>
              <Input
                id="pageDesc"
                placeholder="e.g. Tailored enterprise infrastructure and private cloud deployment"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-slate-900 text-white font-semibold">
                Create Page
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Page SEO Dialog */}
      {editingPage && (
        <Dialog open={Boolean(editingPage)} onOpenChange={() => setEditingPage(null)}>
          <DialogContent className="max-w-md p-6 space-y-4 text-xs">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Edit SEO: {editingPage.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Customize search title, meta description, and social sharing previews.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Page Title (Title Tag)</Label>
                <Input
                  value={editingPage.seo?.title || editingPage.title}
                  onChange={(e) =>
                    setEditingPage({
                      ...editingPage,
                      seo: { ...(editingPage.seo || {}), title: e.target.value },
                    })
                  }
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label>Meta Description</Label>
                <Input
                  value={editingPage.seo?.description || editingPage.description}
                  onChange={(e) =>
                    setEditingPage({
                      ...editingPage,
                      seo: { ...(editingPage.seo || {}), description: e.target.value },
                    })
                  }
                  className="text-xs h-9"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border">
                <div>
                  <span className="font-semibold block text-slate-900">Show in Main Nav</span>
                  <span className="text-[10px] text-slate-400">Display link in header menu</span>
                </div>
                <Switch
                  checked={editingPage.visibleInNav}
                  onCheckedChange={(checked) =>
                    setEditingPage({ ...editingPage, visibleInNav: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button size="sm" variant="outline" onClick={() => setEditingPage(null)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSavePageSeo} className="text-xs bg-slate-900 text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
