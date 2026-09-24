'use client';

import React from 'react';
import Link from 'next/link';
import {
  Server,
  Zap,
  Globe,
  Check,
  Search,
  ShoppingCart,
  ShieldCheck,
  Layers,
  HelpCircle,
  FileText,
  Mail,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import type { StorefrontConfig, StorefrontPageConfig, Product } from '@/lib/demo/types';
import type { ViewportMode } from './editor-toolbar';
import { useDemo } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/demo/selectors';
import { StorefrontThemeProvider } from '@/components/storefront/storefront-theme-provider';
import { StorefrontNavbar } from '@/components/storefront/storefront-navbar';
import { StorefrontFooter } from '@/components/storefront/storefront-footer';
import { SectionRenderer } from '@/components/storefront/section-renderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EditorCanvasProps {
  config: StorefrontConfig;
  currentPageSlug: string;
  viewport: ViewportMode;
  selectedSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  onNavigatePage: (slug: string) => void;
}

export function EditorCanvas({
  config,
  currentPageSlug,
  viewport,
  selectedSectionId,
  onSelectSection,
  onNavigatePage,
}: EditorCanvasProps) {
  const { state } = useDemo();
  const primaryColor = config.primaryColor || '#0f5fff';
  const accentColor = config.accentColor || '#00c896';

  const isHome = !currentPageSlug || currentPageSlug === 'home';
  const customPage = config.pages?.find((p) => p.slug === currentPageSlug && p.type === 'custom');

  // Device framing styles
  const viewportContainerClasses: Record<ViewportMode, string> = {
    desktop: 'w-full min-h-screen bg-white transition-all duration-300',
    tablet: 'w-[768px] mx-auto my-6 rounded-2xl border-8 border-slate-800 shadow-2xl overflow-hidden bg-white min-h-[900px] transition-all duration-300',
    mobile: 'w-[375px] mx-auto my-6 rounded-3xl border-8 border-slate-800 shadow-2xl overflow-hidden bg-white min-h-[750px] transition-all duration-300',
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-2 sm:p-4">
      {/* Viewport Width Constraint Frame */}
      <div className={viewportContainerClasses[viewport]}>
        <StorefrontThemeProvider config={config}>
          <div className="min-h-full flex flex-col bg-white text-slate-900 font-sans">
            {/* White-Label Header */}
            <StorefrontNavbar config={config} />

            {/* Page Body */}
            <main className="flex-1">
              {isHome && (
                <SectionRenderer
                  sections={config.sections || []}
                  config={config}
                  isEditorPreview={true}
                  selectedSectionId={selectedSectionId}
                  onSelectSection={onSelectSection}
                />
              )}

              {currentPageSlug === 'hosting' && (
                <HostingPreviewPage config={config} />
              )}

              {currentPageSlug === 'vps' && (
                <VpsPreviewPage config={config} />
              )}

              {currentPageSlug === 'domains' && (
                <DomainsPreviewPage config={config} />
              )}

              {currentPageSlug === 'managed' && (
                <ManagedPreviewPage config={config} />
              )}

              {currentPageSlug === 'about' && (
                <AboutPreviewPage config={config} />
              )}

              {currentPageSlug === 'contact' && (
                <ContactPreviewPage config={config} />
              )}

              {currentPageSlug === 'support' && (
                <SupportPreviewPage config={config} />
              )}

              {currentPageSlug === 'knowledge-base' && (
                <KbPreviewPage config={config} />
              )}

              {currentPageSlug === 'status' && (
                <StatusPreviewPage config={config} />
              )}

              {(currentPageSlug === 'privacy' || currentPageSlug === 'terms') && (
                <LegalPreviewPage config={config} type={currentPageSlug} />
              )}

              {customPage && (
                <CustomPagePreview config={config} page={customPage} onSelectSection={onSelectSection} selectedSectionId={selectedSectionId} />
              )}
            </main>

            {/* White-Label Footer */}
            <StorefrontFooter config={config} />
          </div>
        </StorefrontThemeProvider>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Sub-page Previews inside Editor Canvas
// -------------------------------------------------------------

function HostingPreviewPage({ config }: { config: StorefrontConfig }) {
  const { state } = useDemo();
  const primaryColor = config.primaryColor || '#0f5fff';
  const displayed = state.products.filter(
    (p: Product) => p.available && config.displayedProductIds?.includes(p.id)
  );

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <Badge variant="outline" className="text-slate-600 border-slate-300">
          Hosting Catalog
        </Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          High-Performance Shared & Cloud Hosting
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto">
          Ultra-fast NVMe storage, free automated SSL, and 99.9% uptime architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayed.map((product: Product) => {
          const monthly = product.pricing.find((p: any) => p.cycle === 'monthly')?.price || 9.99;
          return (
            <div
              key={product.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-slate-900">{product.name}</h3>
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                    {product.type.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{product.description}</p>
                {config.showProductPricing && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">${monthly}</span>
                    <span className="text-xs text-slate-500">/month</span>
                  </div>
                )}
                <ul className="space-y-2 pt-2 border-t border-slate-100">
                  {product.resourceLimits.map((l: any, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-700">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span><strong>{l.label}:</strong> {l.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <Button
                  className="w-full text-white text-xs font-semibold h-10 shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Configure & Order
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VpsPreviewPage({ config }: { config: StorefrontConfig }) {
  const primaryColor = config.primaryColor || '#0f5fff';
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <Badge variant="outline" className="text-slate-600 border-slate-300">
          Compute Infrastructure
        </Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Cloud Virtual Private Servers
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto">
          Dedicated CPU, memory, and NVMe disk performance with instantaneous deployment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h3 className="font-bold text-lg text-slate-900">Developer Cloud 2-Core</h3>
          <p className="text-xs text-slate-600">2 vCPU • 4GB ECC RAM • 80GB NVMe SSD • 4TB Transfer</p>
          <div className="text-2xl font-extrabold text-slate-900">$19.99 <span className="text-xs font-normal text-slate-500">/mo</span></div>
          <Button className="w-full text-white text-xs font-semibold h-9" style={{ backgroundColor: primaryColor }}>
            Deploy VPS
          </Button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h3 className="font-bold text-lg text-slate-900">Enterprise Cloud 4-Core</h3>
          <p className="text-xs text-slate-600">4 vCPU • 8GB ECC RAM • 160GB NVMe SSD • 8TB Transfer</p>
          <div className="text-2xl font-extrabold text-slate-900">$39.99 <span className="text-xs font-normal text-slate-500">/mo</span></div>
          <Button className="w-full text-white text-xs font-semibold h-9" style={{ backgroundColor: primaryColor }}>
            Deploy VPS
          </Button>
        </div>
      </div>
    </div>
  );
}

function DomainsPreviewPage({ config }: { config: StorefrontConfig }) {
  const primaryColor = config.primaryColor || '#0f5fff';
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 text-center">
      <div className="space-y-3">
        <Badge variant="outline" className="text-slate-600 border-slate-300">
          Domain Marketplace
        </Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Register or Transfer Your Domain
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Over 200 extensions supported with instant DNS record configuration.
        </p>
      </div>

      <div className="max-w-2xl mx-auto flex gap-2">
        <input
          type="text"
          placeholder="Find your ideal domain (e.g. yourbrand.com)"
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs shadow-2xs"
          readOnly
        />
        <Button className="text-white text-xs font-semibold px-6 h-10" style={{ backgroundColor: primaryColor }}>
          <Search className="h-3.5 w-3.5 mr-1" />
          Search
        </Button>
      </div>
    </div>
  );
}

function ManagedPreviewPage({ config }: { config: StorefrontConfig }) {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <Badge variant="outline" className="text-slate-600 border-slate-300">Turnkey Support</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">Managed Services & DNS</h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Let our infrastructure engineers manage WordPress updates, automated backup retention, and Anycast routing.
        </p>
      </div>
    </div>
  );
}

function AboutPreviewPage({ config }: { config: StorefrontConfig }) {
  return (
    <div className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <Badge variant="outline" className="text-slate-600 border-slate-300">About {config.branding?.businessName || config.businessName}</Badge>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Our Hosting Infrastructure Philosophy</h1>
      <p className="text-sm text-slate-600 leading-relaxed">
        {config.branding?.tagline || config.tagline}
      </p>
      <p className="text-xs text-slate-500 leading-relaxed">
        Built on containerized isolation, redundant Ceph storage clustering, and automated SSL provisioning. We believe in honest resource limits, zero overselling, and responsive technical support.
      </p>
    </div>
  );
}

function ContactPreviewPage({ config }: { config: StorefrontConfig }) {
  const primaryColor = config.primaryColor || '#0f5fff';
  return (
    <div className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-3 text-center">
        <Badge variant="outline" className="text-slate-600 border-slate-300">Contact</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Get in Touch</h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Reach our sales or engineering team for technical inquiries or custom cluster quotes.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Direct Contact Details</h3>
          <p className="text-xs text-slate-600">Email: {config.branding?.email || config.email}</p>
          <p className="text-xs text-slate-600">Phone: {config.branding?.phone || config.phone}</p>
          <p className="text-xs text-slate-600">Support: Open 24/7 for active customer tickets</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 text-xs">
          <input className="w-full border rounded-lg p-2 text-xs" placeholder="Your Name" readOnly />
          <input className="w-full border rounded-lg p-2 text-xs" placeholder="Email Address" readOnly />
          <textarea className="w-full border rounded-lg p-2 text-xs" placeholder="Message" rows={3} readOnly />
          <Button className="w-full text-white text-xs h-8" style={{ backgroundColor: primaryColor }}>Send Message</Button>
        </div>
      </div>
    </div>
  );
}

function SupportPreviewPage({ config }: { config: StorefrontConfig }) {
  return (
    <div className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 text-center">
      <Badge variant="outline" className="text-slate-600 border-slate-300">Support Center</Badge>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Technical Assistance & Helpdesk</h1>
      <p className="text-sm text-slate-600 max-w-lg mx-auto">
        Need assistance with nameserver delegation, cPanel credentials, or VPS SSH keys? Our technical staff is available around the clock.
      </p>
    </div>
  );
}

function KbPreviewPage({ config }: { config: StorefrontConfig }) {
  return (
    <div className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <Badge variant="outline" className="text-slate-600 border-slate-300">Knowledge Base</Badge>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Documentation & Tutorials</h1>
      <p className="text-sm text-slate-600">Browse step-by-step guides for DNS configuration, SSL setup, and PHP management.</p>
    </div>
  );
}

function StatusPreviewPage({ config }: { config: StorefrontConfig }) {
  return (
    <div className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">All Systems Operational</Badge>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Status Telemetry</h1>
      <p className="text-sm text-slate-600">Live operational status across all regional hosting clusters and Anycast DNS nodes.</p>
    </div>
  );
}

function LegalPreviewPage({ config, type }: { config: StorefrontConfig; type: 'privacy' | 'terms' }) {
  const isPrivacy = type === 'privacy';
  return (
    <div className="py-14 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
      </h1>
      <p className="text-xs text-slate-600 leading-relaxed">
        {isPrivacy
          ? `This policy explains how ${config.branding?.legalName || config.branding?.businessName || config.businessName} handles personal data, telemetry, and hosting account credentials in accordance with privacy regulations.`
          : `These terms of service govern your use of cloud hosting services, domain registrations, and virtual servers provided by ${config.branding?.legalName || config.branding?.businessName || config.businessName}.`}
      </p>
    </div>
  );
}

function CustomPagePreview({
  config,
  page,
  onSelectSection,
  selectedSectionId,
}: {
  config: StorefrontConfig;
  page: StorefrontPageConfig;
  onSelectSection: (sectionId: string) => void;
  selectedSectionId: string | null;
}) {
  return (
    <div className="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      <div className="space-y-3">
        <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">Custom Page</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{page.title}</h1>
        {page.customContent?.leadParagraph && (
          <p className="text-base text-slate-600 leading-relaxed">{page.customContent.leadParagraph}</p>
        )}
      </div>

      {page.customContent?.blocks && page.customContent.blocks.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-slate-100">
          {page.customContent.blocks.map((block, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">{block.heading}</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{block.body}</p>
            </div>
          ))}
        </div>
      )}

      {page.sections && page.sections.length > 0 && (
        <div className="pt-6">
          <SectionRenderer
            sections={page.sections}
            config={config}
            isEditorPreview={true}
            selectedSectionId={selectedSectionId}
            onSelectSection={onSelectSection}
          />
        </div>
      )}
    </div>
  );
}
