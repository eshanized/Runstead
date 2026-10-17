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
          className="shadow-lg bg-slate-900 text-white border-slate-800 hover:bg-slate-800 text-xs gap-1.5 h-8 px-3"
        >
          <Eye className="h-3.5 w-3.5" />
          Storefront Preview Controls
        </Button>
      </div>
    );
  }

  return (
    <aside aria-label="Storefront Preview Bar" className="border-b border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-300 transition-all">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-white">Storefront Live Preview:</span>
          <span className="hidden sm:inline text-slate-400">
            Publishing as <strong className="font-semibold text-white">{businessName}</strong> • Real-time DB catalog enabled.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild className="h-7 text-xs bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200">
            <Link href="/demo/storefront">
              <Edit3 className="mr-1.5 h-3 w-3 text-slate-400" /> Storefront Editor
            </Link>
          </Button>
          <Button size="sm" asChild className="h-7 text-xs bg-emerald-600 text-white hover:bg-emerald-500">
            <Link href="/demo/overview">
              <LayoutDashboard className="mr-1.5 h-3 w-3" /> Reseller Dashboard
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            title="Hide preview controls"
            className="h-7 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <EyeOff className="h-3 w-3 mr-1" /> Hide
          </Button>
        </div>
      </div>
    </aside>
  );
}
