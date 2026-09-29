'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit3, ExternalLink, LayoutDashboard, User, EyeOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StorefrontDemoBannerProps {
  businessName: string;
}

export function StorefrontDemoBanner({ businessName }: StorefrontDemoBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsDismissed(false)}
          className="shadow-lg bg-amber-500 text-white border-amber-600 hover:bg-amber-600 text-xs gap-1.5 h-8 px-3"
        >
          <Eye className="h-3.5 w-3.5" />
          Show Investor Demo Banner
        </Button>
      </div>
    );
  }

  return (
    <aside aria-label="Demo Operator Header" className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-900 transition-all">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-semibold">White-Label Storefront Preview:</span>
          <span className="hidden sm:inline">
            This is how end-customers see and buy from <strong className="font-semibold">{businessName}</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild className="h-7 text-xs bg-white/90 border-amber-300 hover:bg-white text-slate-800">
            <Link href="/demo/storefront">
              <Edit3 className="mr-1.5 h-3 w-3 text-amber-700" /> Storefront Editor
            </Link>
          </Button>
          <Button size="sm" asChild className="h-7 text-xs bg-slate-900 text-white hover:bg-slate-800">
            <Link href="/demo/overview">
              <LayoutDashboard className="mr-1.5 h-3 w-3" /> Reseller Dashboard
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            title="Hide investor banner to view pure white-label site"
            className="h-7 text-xs text-amber-800 hover:bg-amber-500/20"
          >
            <EyeOff className="h-3 w-3 mr-1" /> Hide
          </Button>
        </div>
      </div>
    </aside>
  );
}
