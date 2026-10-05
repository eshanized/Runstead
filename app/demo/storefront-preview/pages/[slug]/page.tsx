'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { SectionRenderer } from '@/components/storefront/section-renderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function CustomStorefrontPage() {
  const params = useParams();
  const slugParam = (params?.slug as string) || '';

  const { state } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  // Look up page in config
  const pageConfig = config.pages.find(
    (p) => p.slug.toLowerCase() === slugParam.toLowerCase()
  );

  if (!pageConfig) {
    return (
      <StorefrontLayout overrideConfig={config}>
        <div className="py-24 text-center space-y-4 max-w-md mx-auto px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 mx-auto">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Custom Page Not Found</h1>
          <p className="text-xs text-slate-600">
            The page &ldquo;{slugParam}&rdquo; has not been created or published in this storefront yet.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button asChild size="sm" className="text-xs text-white" style={{ backgroundColor: primaryColor }}>
              <Link href="/demo/storefront-preview">Return to Homepage</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="text-xs bg-white">
              <Link href="/demo/storefront">Open Page Builder</Link>
            </Button>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/demo/storefront-preview" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-900">{pageConfig.title}</span>
          </div>

          {/* Page Header */}
          <div className="space-y-3">
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-xs">
              Custom Storefront Page
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              {pageConfig.title}
            </h1>
            {pageConfig.description && (
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                {pageConfig.description}
              </p>
            )}
          </div>

          {/* Custom Content Blocks */}
          {pageConfig.customContent && (
            <Card className="border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
              {pageConfig.customContent.leadParagraph && (
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  {pageConfig.customContent.leadParagraph}
                </p>
              )}

              {pageConfig.customContent.blocks && pageConfig.customContent.blocks.length > 0 && (
                <div className="space-y-6 divide-y divide-slate-100 text-xs text-slate-600 leading-relaxed">
                  {pageConfig.customContent.blocks.map((block, idx) => (
                    <div key={idx} className={idx > 0 ? 'pt-6 space-y-2' : 'space-y-2'}>
                      <h3 className="font-bold text-sm text-slate-900">{block.heading}</h3>
                      <p className="whitespace-pre-line">{block.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Optional page-specific sections */}
          {pageConfig.sections && pageConfig.sections.length > 0 && (
            <SectionRenderer sections={pageConfig.sections} config={config} />
          )}

          <div className="pt-4 flex justify-between items-center text-xs text-slate-500 border-t border-slate-200">
            <Link href="/demo/storefront-preview" className="flex items-center gap-1.5 hover:text-slate-900 font-semibold">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Storefront
            </Link>
            <Link href="/demo/storefront" className="text-blue-600 hover:text-blue-700 underline font-semibold">
              Edit this page in Storefront Editor
            </Link>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
