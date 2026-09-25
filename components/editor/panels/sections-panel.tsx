'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Layout,
  Globe,
  Server,
  Layers,
  Zap,
  HelpCircle,
  Headphones,
  Mail,
  FileText,
  Sparkles,
  Sliders,
  Check,
  ChevronRight,
} from 'lucide-react';
import type { StorefrontConfig, StorefrontSection, SectionType } from '@/lib/demo/types';
import { createDefaultSection } from '@/lib/demo/storefront-presets';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SectionsPanelProps {
  config: StorefrontConfig;
  onChange: (updated: StorefrontConfig) => void;
  selectedSectionId: string | null;
  onSelectSection: (sectionId: string | null) => void;
  currentPageSlug: string;
}

const AVAILABLE_SECTION_TYPES: Array<{
  type: SectionType;
  title: string;
  category: 'Conversion' | 'Products' | 'Content' | 'Support';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    type: 'hero',
    title: 'Hero Banner',
    category: 'Conversion',
    description: 'Prominent headline, value proposition, action buttons, and background graphic.',
    icon: Layout,
  },
  {
    type: 'domain_search',
    title: 'Domain Search Box',
    category: 'Conversion',
    description: 'Instant domain lookup bar with popular TLD badges and pricing.',
    icon: Globe,
  },
  {
    type: 'featured_plans',
    title: 'Featured Hosting Plans',
    category: 'Products',
    description: 'Pricing tier cards with monthly/annual billing cycle toggle and feature bullets.',
    icon: Server,
  },
  {
    type: 'hosting_categories',
    title: 'Hosting Categories',
    category: 'Products',
    description: 'Navigation grid for Shared, VPS, Domains, and Managed cloud tiers.',
    icon: Layers,
  },
  {
    type: 'vps_highlights',
    title: 'Cloud VPS Specs',
    category: 'Products',
    description: 'Hardware compute meters, root access highlights, and developer server controls.',
    icon: Zap,
  },
  {
    type: 'managed_hosting',
    title: 'Managed Services Showcase',
    category: 'Products',
    description: 'WordPress care, automatic updates, and Anycast DNS benefits.',
    icon: Sliders,
  },
  {
    type: 'product_comparison',
    title: 'Specification Matrix',
    category: 'Products',
    description: 'Side-by-side technical comparison table across all hosting packages.',
    icon: Layers,
  },
  {
    type: 'features_grid',
    title: 'Infrastructure Features Grid',
    category: 'Content',
    description: '4-column technical advantages (NVMe, automated SSL, isolated cgroups, global DNS).',
    icon: Sparkles,
  },
  {
    type: 'benefits',
    title: 'Platform Benefits',
    category: 'Content',
    description: 'Developer tooling, instant provisioning, and predictable resource allocation.',
    icon: Zap,
  },
  {
    type: 'resource_limits',
    title: 'Resource Allocation Transparency',
    category: 'Content',
    description: 'No-overselling policy details and guaranteed CPU/RAM limits.',
    icon: Server,
  },
  {
    type: 'faq_accordion',
    title: 'Frequently Asked Questions',
    category: 'Content',
    description: 'Collapsible accordion answering common onboarding and billing questions.',
    icon: HelpCircle,
  },
  {
    type: 'custom_rich_text',
    title: 'Custom Content Block',
    category: 'Content',
    description: 'Freeform text, callout boxes, and custom action links.',
    icon: FileText,
  },
  {
    type: 'promotional_banner',
    title: 'Promotional Banner',
    category: 'Conversion',
    description: 'High-contrast gradient banner highlighting limited-time discounts or campaigns.',
    icon: Sparkles,
  },
  {
    type: 'support_cta',
    title: 'Support & Helpdesk CTA',
    category: 'Support',
    description: 'Direct callout to open a support ticket or visit the knowledge base.',
    icon: Headphones,
  },
  {
    type: 'newsletter_cta',
    title: 'Newsletter Subscription',
    category: 'Support',
    description: 'Email capture form for maintenance updates and hosting announcements.',
    icon: Mail,
  },
];

export function SectionsPanel({
  config,
  onChange,
  selectedSectionId,
  onSelectSection,
  currentPageSlug,
}: SectionsPanelProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Currently we edit the home page sections or the specific page's sections
  const isHomePage = !currentPageSlug || currentPageSlug === 'home';
  const targetPage = !isHomePage ? config.pages.find((p) => p.slug === currentPageSlug) : null;
  const sections = isHomePage
    ? config.sections || []
    : targetPage?.sections || [];

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  function updateSections(newSections: StorefrontSection[]) {
    if (isHomePage) {
      onChange({
        ...config,
        sections: newSections,
        isDraftDirty: true,
      });
    } else if (targetPage) {
      const updatedPages = config.pages.map((p) =>
        p.slug === currentPageSlug ? { ...p, sections: newSections } : p
      );
      onChange({
        ...config,
        pages: updatedPages,
        isDraftDirty: true,
      });
    }
  }

  function handleAddSection(type: SectionType) {
    const nextOrder = sortedSections.length > 0
      ? Math.max(...sortedSections.map((s) => s.order)) + 1
      : 1;
    const newSection = createDefaultSection(type, nextOrder);
    updateSections([...sortedSections, newSection]);
    setAddModalOpen(false);
    onSelectSection(newSection.id);
    toast.success(`Added ${newSection.title} section`);
  }

  function handleToggleSection(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = sortedSections.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    updateSections(updated);
  }

  function handleMoveUp(index: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (index === 0) return;
    const items = [...sortedSections];
    const prev = items[index - 1];
    const curr = items[index];
    const tempOrder = prev.order;
    prev.order = curr.order;
    curr.order = tempOrder;
    updateSections(items);
  }

  function handleMoveDown(index: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (index >= sortedSections.length - 1) return;
    const items = [...sortedSections];
    const next = items[index + 1];
    const curr = items[index];
    const tempOrder = next.order;
    next.order = curr.order;
    curr.order = tempOrder;
    updateSections(items);
  }

  function handleDuplicate(section: StorefrontSection, e: React.MouseEvent) {
    e.stopPropagation();
    const nextOrder = Math.max(...sortedSections.map((s) => s.order)) + 1;
    const duplicated: StorefrontSection = {
      ...section,
      id: `sec_${section.type}_${Date.now()}_copy`,
      title: `${section.title} (Copy)`,
      order: nextOrder,
      settings: JSON.parse(JSON.stringify(section.settings || {})),
    };
    updateSections([...sortedSections, duplicated]);
    onSelectSection(duplicated.id);
    toast.success(`Duplicated ${section.title}`);
  }

  function handleDeleteConfirm() {
    if (!deleteConfirmId) return;
    const target = sortedSections.find((s) => s.id === deleteConfirmId);
    const updated = sortedSections.filter((s) => s.id !== deleteConfirmId);
    updateSections(updated);
    if (selectedSectionId === deleteConfirmId) {
      onSelectSection(null);
    }
    setDeleteConfirmId(null);
    toast.success(`Removed ${target?.title || 'section'}`);
  }

  const filteredCatalog = AVAILABLE_SECTION_TYPES.filter(
    (item) => categoryFilter === 'All' || item.category === categoryFilter
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {isHomePage ? 'Home Page Sections' : `${targetPage?.title || currentPageSlug} Sections`}
          </h3>
          <p className="text-xs text-slate-500">
            {sortedSections.length} {sortedSections.length === 1 ? 'section' : 'sections'} configured
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setAddModalOpen(true)}
          className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Section
        </Button>
      </div>

      {!isHomePage && (!targetPage?.sections || targetPage.sections.length === 0) && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
          <p className="text-xs text-slate-500 mb-2">
            This page is using its default layout template. You can add modular sections to override it with customized blocks.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddModalOpen(true)}
            className="text-xs h-7"
          >
            Add First Section
          </Button>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-1.5">
        {sortedSections.map((section, index) => {
          const isSelected = selectedSectionId === section.id;
          const matchingType = AVAILABLE_SECTION_TYPES.find((t) => t.type === section.type);
          const Icon = matchingType?.icon || Layout;

          return (
            <div
              key={section.id}
              onClick={() => onSelectSection(section.id)}
              className={`group flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-500/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              } ${!section.enabled ? 'opacity-60 bg-slate-50' : ''}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-900 truncate">
                      {section.title || matchingType?.title || section.type}
                    </span>
                    {!section.enabled && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-slate-300 text-slate-500">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">
                    {matchingType?.category || section.type}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-slate-400 hover:text-slate-700"
                  disabled={index === 0}
                  onClick={(e) => handleMoveUp(index, e)}
                  title="Move Up"
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-slate-400 hover:text-slate-700"
                  disabled={index === sortedSections.length - 1}
                  onClick={(e) => handleMoveDown(index, e)}
                  title="Move Down"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-slate-400 hover:text-slate-700"
                  onClick={(e) => handleToggleSection(section.id, e)}
                  title={section.enabled ? 'Hide Section' : 'Show Section'}
                >
                  {section.enabled ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-amber-600" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-slate-400 hover:text-slate-700"
                  onClick={(e) => handleDuplicate(section, e)}
                  title="Duplicate Section"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-slate-400 hover:text-rose-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(section.id);
                  }}
                  title="Delete Section"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <ChevronRight className={`h-3 w-3 transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Section Dialog */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Section to Storefront</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Choose from 15 modular section types to enrich your storefront experience.
            </DialogDescription>
          </DialogHeader>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 pb-2 border-b border-slate-100">
            {['All', 'Conversion', 'Products', 'Content', 'Support'].map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? 'default' : 'outline'}
                onClick={() => setCategoryFilter(cat)}
                className={`h-7 text-xs px-3 ${categoryFilter === cat ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Section Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 overflow-y-auto py-2 pr-1 max-h-[50vh]">
            {filteredCatalog.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.type}
                  onClick={() => handleAddSection(item.type)}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition-all group"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-700">
                        {item.title}
                      </h4>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-slate-200 text-slate-500">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3">
            <Button variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Remove Section?</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              This will remove the selected section from the page. This action can be reverted before publishing by clicking &ldquo;Revert Unsaved Changes&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>
              Remove Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
