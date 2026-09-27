'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Globe, ShoppingCart } from 'lucide-react';
import { checkDomainAvailability, formatCurrency } from '@/lib/demo/selectors';
import { useDemo } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface DomainSearchSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function DomainSearchSection({ section, config }: DomainSearchSectionProps) {
  const router = useRouter();
  const { state, setState } = useDemo();
  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';

  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ available: boolean; price: number; tld: string } | null>(null);
  const [searchedDomain, setSearchedDomain] = useState('');

  const headline = settings.headline || 'Find your perfect domain name';
  const subtitle = settings.subtitle || 'Deterministic availability lookup across 200+ top-level domains';
  const inputPlaceholder = settings.inputPlaceholder || 'Find your ideal domain (e.g. nexthost-test.com)';
  const featuredTlds = settings.featuredTlds || [
    { tld: '.com', price: 12.99 },
    { tld: '.io', price: 39.99 },
    { tld: '.net', price: 14.99 },
    { tld: '.dev', price: 18.99 },
    { tld: '.org', price: 13.99 },
  ];

  function handleSearch(domainToSearch?: string) {
    const raw = domainToSearch || query;
    if (!raw.trim()) return;

    let target = raw.trim().toLowerCase();
    if (!target.includes('.')) {
      target = `${target}.com`;
    }

    const check = checkDomainAvailability(target);
    setResult(check);
    setSearchedDomain(target);
  }

  function handleAddToCart(domainName: string, price: number) {
    const domainProduct = state.products.find((p) => p.type === 'domain_registration') || state.products[0];
    try {
      setState((prev) =>
        workflows.addToCart(prev, {
          productId: domainProduct.id,
          productName: `Domain Registration (${domainName})`,
          productType: 'domain_registration',
          billingCycle: 'annually',
          unitPrice: price,
          setupFee: 0,
          domainName,
          quantity: 1,
          selectedAddons: [],
        })
      );
      toast.success(`Domain "${domainName}" added to shopping cart!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add domain to cart');
    }
  }

  return (
    <section id="domains" className="bg-white py-16 sm:py-20 border-b border-slate-100">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="space-y-2">
          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
            Domain Marketplace
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{headline}</h2>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Domain Search Form */}
        <div className="mx-auto max-w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-2 rounded-xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder={inputPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 shadow-none pl-10 focus-visible:ring-0 text-sm h-11"
              />
            </div>
            <Button
              type="submit"
              className="text-white font-semibold text-sm h-11 px-6 shadow-sm hover:opacity-95"
              style={{ backgroundColor: primaryColor }}
            >
              Search
            </Button>
          </form>

          {/* Featured TLD Pills */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {featuredTlds.map((tldItem: { tld: string; price: number }) => (
              <button
                key={tldItem.tld}
                type="button"
                onClick={() => {
                  const base = query ? query.split('.')[0] : 'mybrand';
                  const domain = `${base}${tldItem.tld}`;
                  setQuery(domain);
                  handleSearch(domain);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors"
              >
                <span className="font-semibold text-slate-900">{tldItem.tld}</span>
                <span className="text-slate-500">{formatCurrency(tldItem.price)}/yr</span>
              </button>
            ))}
          </div>
        </div>

        {/* Availability Result Display */}
        {result && searchedDomain && (
          <div className="mx-auto max-w-2xl pt-4 animate-in fade-in-50 duration-200">
            <Card className={result.available ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'}>
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  {result.available ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">{searchedDomain}</span>
                      <Badge variant={result.available ? 'default' : 'secondary'} className={result.available ? 'bg-emerald-600 text-white' : ''}>
                        {result.available ? 'Available' : 'Taken'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {result.available
                        ? `Deterministic registration pricing at ${formatCurrency(result.price)}/year (annual cycle).`
                        : 'This domain name is already registered in our demo index.'}
                    </p>
                  </div>
                </div>

                {result.available ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddToCart(searchedDomain, result.price)}
                      className="gap-1.5 text-xs bg-white flex-1 sm:flex-initial"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add to Cart
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      className="text-white text-xs font-semibold flex-1 sm:flex-initial"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Link href={`/demo/checkout?productId=prod_005&domain=${encodeURIComponent(searchedDomain)}&cycle=annually`}>
                        Register Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" asChild className="text-xs bg-white">
                    <Link href={`/demo/storefront-preview/domains/transfer?domain=${encodeURIComponent(searchedDomain)}`}>
                      Transfer to Us
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="pt-2 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-4">
          <span>Already own a domain elsewhere?</span>
          <Link href="/demo/storefront-preview/domains/transfer" className="font-semibold text-slate-700 hover:text-slate-900 underline">
            Start a domain transfer →
          </Link>
        </div>
      </div>
    </section>
  );
}
