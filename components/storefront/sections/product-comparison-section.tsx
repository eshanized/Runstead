'use client';

import Link from 'next/link';
import { Check, X, ArrowRight } from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/demo/selectors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface ProductComparisonSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function ProductComparisonSection({ section, config }: ProductComparisonSectionProps) {
  const { state } = useDemo();
  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';

  const headline = settings.headline || 'Compare hosting tiers side-by-side';
  const subtitle = settings.subtitle || 'Find the exact resource specifications matching your workload requirements';

  const compareProducts = state.products.filter((p) =>
    ['prod_001', 'prod_002', 'prod_003', 'prod_004'].includes(p.id)
  );

  return (
    <section className="bg-slate-50/70 py-16 sm:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white">
            Plan Comparison Matrix
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{headline}</h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-4 sm:p-6 font-bold text-slate-900 w-1/4">Specification</th>
                {compareProducts.map((prod) => (
                  <th key={prod.id} className="p-4 sm:p-6 text-center font-bold text-slate-900">
                    <div className="text-sm font-bold">{prod.name}</div>
                    <div className="text-base font-extrabold text-slate-950 mt-1">
                      {formatCurrency(prod.pricing[0]?.price || 0)}
                      <span className="text-[10px] text-slate-500 font-normal">/mo</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-4 sm:px-6 font-semibold text-slate-900">Storage Pool</td>
                {compareProducts.map((prod) => (
                  <td key={prod.id} className="p-4 sm:px-6 text-center">
                    {prod.resourceLimits.find((l) => l.label.toLowerCase().includes('storage'))?.value || 'Included'}
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-50/40">
                <td className="p-4 sm:px-6 font-semibold text-slate-900">Bandwidth Allowance</td>
                {compareProducts.map((prod) => (
                  <td key={prod.id} className="p-4 sm:px-6 text-center">
                    {prod.resourceLimits.find((l) => l.label.toLowerCase().includes('bandwidth'))?.value || 'Standard'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 sm:px-6 font-semibold text-slate-900">Hosted Domains</td>
                {compareProducts.map((prod) => (
                  <td key={prod.id} className="p-4 sm:px-6 text-center">
                    {prod.resourceLimits.find((l) => l.label.toLowerCase().includes('websites'))?.value ||
                      (prod.type === 'vps' ? 'Unlimited' : '1')}
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-50/40">
                <td className="p-4 sm:px-6 font-semibold text-slate-900">Dedicated Root Access</td>
                {compareProducts.map((prod) => (
                  <td key={prod.id} className="p-4 sm:px-6 text-center">
                    {prod.type === 'vps' ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 sm:px-6 font-semibold text-slate-900">Automated Free SSL</td>
                {compareProducts.map((prod) => (
                  <td key={prod.id} className="p-4 sm:px-6 text-center">
                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-50/40">
                <td className="p-4 sm:px-6 font-semibold text-slate-900">Snapshot Backups</td>
                {compareProducts.map((prod) => (
                  <td key={prod.id} className="p-4 sm:px-6 text-center">
                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 sm:px-6 font-semibold text-slate-900">Action</td>
                {compareProducts.map((prod) => (
                  <td key={prod.id} className="p-4 sm:px-6 text-center">
                    <Button
                      asChild
                      size="sm"
                      className="text-white text-xs h-8 px-4"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Link href={`/storefront/checkout?productId=${prod.id}&cycle=${prod.pricing[0]?.cycle || 'monthly'}`}>
                        Select
                      </Link>
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
