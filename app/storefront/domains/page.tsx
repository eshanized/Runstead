'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Globe,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShoppingCart,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { checkDomainAvailability, formatCurrency } from '@/lib/demo/selectors';
import * as workflows from '@/lib/demo/workflows';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const TLD_CATALOG = [
  { tld: '.com', price: 12.99, renewal: 14.99, desc: 'The gold standard global domain for commercial businesses.' },
  { tld: '.io', price: 39.99, renewal: 44.99, desc: 'The premier choice for technology startups and developer tools.' },
  { tld: '.net', price: 14.99, renewal: 16.99, desc: 'Established and recognized worldwide for networks and cloud platforms.' },
  { tld: '.org', price: 13.99, renewal: 15.99, desc: 'Ideal for non-profits, communities, and open-source foundations.' },
  { tld: '.dev', price: 18.99, renewal: 21.99, desc: 'Secure namespace with built-in HSTS preloading for modern developers.' },
  { tld: '.cloud', price: 19.99, renewal: 22.99, desc: 'Showcase SaaS, cloud architecture, and infrastructure platforms.' },
  { tld: '.tech', price: 11.99, renewal: 24.99, desc: 'Trendy and forward-thinking domain for modern digital ventures.' },
  { tld: '.co', price: 23.99, renewal: 27.99, desc: 'Short, memorable global alternative to .com for startups.' },
];

export default function DomainMarketplacePage() {
  const { state, setState } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const [query, setQuery] = useState('');
  const [selectedTldFilter, setSelectedTldFilter] = useState('all');
  const [searchResult, setSearchResult] = useState<{
    domain: string;
    available: boolean;
    price: number;
    suggestions: Array<{ domain: string; available: boolean; price: number }>;
  } | null>(null);

  function handleSearch(term?: string) {
    const raw = term || query;
    if (!raw.trim()) {
      toast.error('Please enter a domain name to search.');
      return;
    }

    const domainValid = workflows.isValidDomain(raw.includes('.') ? raw : `${raw}.com`);
    if (!domainValid.valid) {
      toast.error(domainValid.error || 'Invalid domain format.');
      return;
    }

    const baseName = raw.split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
    const tld = raw.includes('.') ? `.${raw.split('.').slice(1).join('.')}` : '.com';
    const cleanDomain = `${baseName}${tld}`;

    const mainRes = checkDomainAvailability(cleanDomain);

    // Deterministic suggestions across other TLDs
    const suggestions = ['.io', '.net', '.org', '.dev', '.cloud', '.tech']
      .filter((t) => t !== tld)
      .slice(0, 4)
      .map((ext) => {
        const altDomain = `${baseName}${ext}`;
        const check = checkDomainAvailability(altDomain);
        return {
          domain: altDomain,
          available: check.available,
          price: check.price,
        };
      });

    setSearchResult({
      domain: cleanDomain,
      available: mainRes.available,
      price: mainRes.price,
      suggestions,
    });
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

  const filteredTlds = TLD_CATALOG.filter((item) => {
    if (selectedTldFilter === 'popular') return ['.com', '.io', '.net', '.dev'].includes(item.tld);
    if (selectedTldFilter === 'tech') return ['.io', '.dev', '.tech', '.cloud'].includes(item.tld);
    return true;
  });

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header & Search */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
              Domain Registration & Marketplace
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Register Your Online Identity
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Search and register across 200+ top-level domains. All registrations include Anycast DNS management and WHOIS privacy.
            </p>

            {/* Simulation disclosure */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900 flex items-center justify-center gap-1.5">
              <span>⚡</span>
              <span>
                <strong>Demo Mode:</strong> Domain searches run deterministically against demo registry rules. No live ICANN charge is incurred.
              </span>
            </div>

            {/* Search Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-slate-300 bg-white p-2.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all text-left"
            >
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search your ideal domain (e.g. yourdomain.com or nexthost-test.com)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-0 shadow-none pl-10 h-11 text-sm focus-visible:ring-0"
                />
              </div>
              <Button
                type="submit"
                className="text-white font-semibold text-sm h-11 px-6 shadow-xs hover:opacity-95"
                style={{ backgroundColor: primaryColor }}
              >
                Check Availability
              </Button>
            </form>
          </div>

          {/* Search Result Card */}
          {searchResult && (
            <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in-50">
              <Card className={searchResult.available ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50'}>
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {searchResult.available ? (
                      <CheckCircle2 className="h-7 w-7 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-7 w-7 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-slate-900">{searchResult.domain}</span>
                        <Badge variant={searchResult.available ? 'default' : 'secondary'} className={searchResult.available ? 'bg-emerald-600' : ''}>
                          {searchResult.available ? 'Available' : 'Registered / Taken'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {searchResult.available
                          ? `Registration price: ${formatCurrency(searchResult.price)}/year (Annual billing cycle).`
                          : 'This exact domain is currently unavailable for new registration.'}
                      </p>
                    </div>
                  </div>

                  {searchResult.available ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddToCart(searchResult.domain, searchResult.price)}
                        className="text-xs gap-1.5 bg-white"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                      </Button>
                      <Button
                        size="sm"
                        asChild
                        className="text-white text-xs font-semibold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Link href={`/storefront/checkout?productId=prod_005&domain=${encodeURIComponent(searchResult.domain)}&cycle=annually`}>
                          Register Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" asChild className="text-xs bg-white">
                      <Link href={`/storefront/domains/transfer?domain=${encodeURIComponent(searchResult.domain)}`}>
                        Transfer to Us
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Suggestions */}
              {searchResult.suggestions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Recommended Available Alternatives
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {searchResult.suggestions.map((sug) => (
                      <div
                        key={sug.domain}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-xs text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{sug.domain}</div>
                          <div className="text-slate-500 text-[11px]">{formatCurrency(sug.price)}/year</div>
                        </div>
                        {sug.available ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddToCart(sug.domain, sug.price)}
                            className="h-7 text-[11px] gap-1"
                          >
                            <ShoppingCart className="h-3 w-3" /> Add
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Taken</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TLD Pricing Table */}
          <div className="space-y-4 max-w-5xl mx-auto pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Popular Top-Level Domains (TLDs)</h2>
                <p className="text-xs text-slate-500">Transparent registration and annual renewal fee table</p>
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  ['all', 'All TLDs'],
                  ['popular', 'Popular'],
                  ['tech', 'Tech & Cloud'],
                ].map(([fVal, label]) => (
                  <button
                    key={fVal}
                    type="button"
                    onClick={() => setSelectedTldFilter(fVal)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                      selectedTldFilter === fVal ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                    <th className="p-3.5 sm:px-6">Domain Extension</th>
                    <th className="p-3.5 sm:px-6">Description</th>
                    <th className="p-3.5 sm:px-6">Registration (1st Year)</th>
                    <th className="p-3.5 sm:px-6">Renewal</th>
                    <th className="p-3.5 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredTlds.map((tld) => (
                    <tr key={tld.tld} className="hover:bg-slate-50/50">
                      <td className="p-3.5 sm:px-6 font-bold text-slate-900 text-sm">{tld.tld}</td>
                      <td className="p-3.5 sm:px-6 text-slate-500 max-w-xs">{tld.desc}</td>
                      <td className="p-3.5 sm:px-6 font-bold text-slate-900">{formatCurrency(tld.price)}/yr</td>
                      <td className="p-3.5 sm:px-6 text-slate-500">{formatCurrency(tld.renewal)}/yr</td>
                      <td className="p-3.5 sm:px-6 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setQuery(`mybrand${tld.tld}`);
                            handleSearch(`mybrand${tld.tld}`);
                          }}
                          className="h-7 text-xs bg-white"
                        >
                          Check
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* External domain connection / Transfer CTA card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto pt-6">
            <Card className="border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-blue-600" />
                Transfer Your Domain
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consolidate your domains under one unified billing and DNS management dashboard with automated renewal protection.
              </p>
              <Button asChild variant="outline" size="sm" className="text-xs bg-white">
                <Link href="/storefront/domains/transfer">
                  Start Domain Transfer Process →
                </Link>
              </Button>
            </Card>

            <Card className="border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-emerald-600" />
                Connect an Existing Domain
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Keep your domain at your current registrar and point its A records or nameservers to our high-performance cloud nodes.
              </p>
              <Button asChild variant="outline" size="sm" className="text-xs bg-white">
                <Link href="/storefront/hosting">
                  Choose Hosting Plan & Attach Domain →
                </Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
