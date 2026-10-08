'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Layers,
  Palette,
  Building2,
  Menu,
  LayoutTemplate,
  Search,
  Settings,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DemoShell } from '@/components/demo/demo-shell';
import { useDemo } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import type { StorefrontConfig } from '@/lib/demo/types';
import { EditorToolbar, type ViewportMode } from '@/components/editor/editor-toolbar';
import { EditorCanvas } from '@/components/editor/editor-canvas';
import { PagesPanel } from '@/components/editor/panels/pages-panel';
import { SectionsPanel } from '@/components/editor/panels/sections-panel';
import { ThemePanel } from '@/components/editor/panels/theme-panel';
import { BrandingPanel } from '@/components/editor/panels/branding-panel';
import { HeaderPanel } from '@/components/editor/panels/header-panel';
import { FooterPanel } from '@/components/editor/panels/footer-panel';
import { SeoPanel } from '@/components/editor/panels/seo-panel';
import { SettingsPanel } from '@/components/editor/panels/settings-panel';
import { SectionInspector } from '@/components/editor/panels/section-inspector';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

type EditorTab = 'pages' | 'sections' | 'theme' | 'branding' | 'header' | 'footer' | 'seo' | 'settings';

export default function StorefrontPage() {
  return (
    <DemoShell>
      <StorefrontEditorContent />
    </DemoShell>
  );
}

function StorefrontEditorContent() {
  const { state, setState } = useDemo();
  const draftConfig = state.storefront;

  const [activeTab, setActiveTab] = useState<EditorTab>('sections');
  const [currentPageSlug, setCurrentPageSlug] = useState<string>('home');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  function handleConfigChange(updated: StorefrontConfig) {
    setState((prev) => workflows.saveStorefrontDraft(prev, updated));
  }

  function handleSaveDraft() {
    setState((prev) => workflows.saveStorefrontDraft(prev, draftConfig));
    toast.success('Draft configuration saved in local demo state');
  }

  function handlePublish() {
    setState((prev) => workflows.publishStorefrontDraft(prev));
    toast.success('Storefront published! Live preview is now updated.');
  }

  function handleRevert() {
    setState((prev) => workflows.revertStorefrontDraft(prev));
    setSelectedSectionId(null);
    toast.info('Reverted to published configuration');
  }

  function handleResetToDefaults() {
    setState((prev) => workflows.resetStorefrontToDefaults(prev));
    setSelectedSectionId(null);
    setCurrentPageSlug('home');
    toast.info('Reset storefront to default CloudVista configuration');
  }

  function handleSelectSection(sectionId: string | null) {
    setSelectedSectionId(sectionId);
    if (sectionId) {
      setActiveTab('sections');
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-6 overflow-hidden bg-slate-100">
      {/* Top Workspace Toolbar */}
      <EditorToolbar
        config={draftConfig}
        currentPageSlug={currentPageSlug}
        onPageChange={(slug) => {
          setCurrentPageSlug(slug);
          setSelectedSectionId(null);
        }}
        viewport={viewport}
        onViewportChange={setViewport}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onRevert={handleRevert}
      />

      {/* Main 2-Panel Builder Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Control Panel / Inspector Region */}
        <aside className="w-full max-w-[390px] shrink-0 border-r border-slate-200 bg-white flex flex-col h-full shadow-xs z-10">
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as EditorTab);
              if (val !== 'sections') {
                setSelectedSectionId(null);
              }
            }}
            className="flex flex-col h-full"
          >
            {/* Scrollable Tab Pills */}
            <div className="border-b border-slate-200 px-2 py-2 overflow-x-auto bg-slate-50/70 shrink-0">
              <TabsList className="grid grid-cols-4 gap-1 h-auto p-1 bg-slate-200/60 rounded-lg">
                <TabsTrigger value="sections" className="text-[11px] py-1.5 px-2 gap-1 data-[state=active]:bg-white">
                  <Layers className="h-3.5 w-3.5" />
                  Sections
                </TabsTrigger>
                <TabsTrigger value="pages" className="text-[11px] py-1.5 px-2 gap-1 data-[state=active]:bg-white">
                  <FileText className="h-3.5 w-3.5" />
                  Pages
                </TabsTrigger>
                <TabsTrigger value="theme" className="text-[11px] py-1.5 px-2 gap-1 data-[state=active]:bg-white">
                  <Palette className="h-3.5 w-3.5" />
                  Theme
                </TabsTrigger>
                <TabsTrigger value="branding" className="text-[11px] py-1.5 px-2 gap-1 data-[state=active]:bg-white">
                  <Building2 className="h-3.5 w-3.5" />
                  Brand
                </TabsTrigger>
              </TabsList>

              <TabsList className="grid grid-cols-4 gap-1 h-auto p-1 bg-slate-200/60 rounded-lg mt-1">
                <TabsTrigger value="header" className="text-[11px] py-1.5 px-2 gap-1 data-[state=active]:bg-white">
                  <Menu className="h-3.5 w-3.5" />
                  Header
                </TabsTrigger>
                <TabsTrigger value="footer" className="text-[11px] py-1.5 px-2 gap-1 data-[state=active]:bg-white">
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  Footer
                </TabsTrigger>
                <TabsTrigger value="seo" className="text-[11px] py-1.5 px-2 gap-1 data-[state=active]:bg-white">
                  <Search className="h-3.5 w-3.5" />
                  SEO
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-[11px] py-1.5 px-2 gap-1 data-[state=active]:bg-white">
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Panel Body Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="sections" className="mt-0 space-y-4">
                {selectedSectionId ? (
                  <SectionInspector
                    sectionId={selectedSectionId}
                    config={draftConfig}
                    onChange={handleConfigChange}
                    onBack={() => setSelectedSectionId(null)}
                    currentPageSlug={currentPageSlug}
                  />
                ) : (
                  <SectionsPanel
                    config={draftConfig}
                    onChange={handleConfigChange}
                    selectedSectionId={selectedSectionId}
                    onSelectSection={handleSelectSection}
                    currentPageSlug={currentPageSlug}
                  />
                )}
              </TabsContent>

              <TabsContent value="pages" className="mt-0">
                <PagesPanel
                  config={draftConfig}
                  onChange={handleConfigChange}
                  selectedPageSlug={currentPageSlug}
                  onSelectPage={(slug) => {
                    setCurrentPageSlug(slug);
                    setSelectedSectionId(null);
                  }}
                />
              </TabsContent>

              <TabsContent value="theme" className="mt-0">
                <ThemePanel config={draftConfig} onChange={handleConfigChange} />
              </TabsContent>

              <TabsContent value="branding" className="mt-0">
                <BrandingPanel config={draftConfig} onChange={handleConfigChange} />
              </TabsContent>

              <TabsContent value="header" className="mt-0">
                <HeaderPanel config={draftConfig} onChange={handleConfigChange} />
              </TabsContent>

              <TabsContent value="footer" className="mt-0">
                <FooterPanel config={draftConfig} onChange={handleConfigChange} />
              </TabsContent>

              <TabsContent value="seo" className="mt-0">
                <SeoPanel config={draftConfig} onChange={handleConfigChange} />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <SettingsPanel
                  config={draftConfig}
                  onChange={handleConfigChange}
                  onResetToDefaults={handleResetToDefaults}
                  onRevertToPublished={handleRevert}
                />
              </TabsContent>
            </div>
          </Tabs>
        </aside>

        {/* Center / Right Canvas Region */}
        <EditorCanvas
          config={draftConfig}
          currentPageSlug={currentPageSlug}
          viewport={viewport}
          selectedSectionId={selectedSectionId}
          onSelectSection={handleSelectSection}
          onNavigatePage={(slug) => {
            setCurrentPageSlug(slug);
            setSelectedSectionId(null);
          }}
        />
      </div>
    </div>
  );
}
