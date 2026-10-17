'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, BookOpen, FileText, ChevronRight, Server, Globe, Shield, CreditCard } from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const KB_CATEGORIES = [
  {
    id: 'getting-started',
    icon: BookOpen,
    title: 'Getting Started',
    desc: 'Account setup, initial DNS configuration, and quick deployment guides.',
    articles: [
      { id: 'kb_1', title: 'How to point your domain to our nameservers', readTime: '3 min read' },
      { id: 'kb_2', title: 'Accessing your hosting container and FTP credentials', readTime: '4 min read' },
      { id: 'kb_3', title: 'Setting up automated SSL certificates via Let\'s Encrypt', readTime: '2 min read' },
    ],
  },
  {
    id: 'dns-domains',
    icon: Globe,
    title: 'Domains & DNS Routing',
    desc: 'Configuring RFC-compliant A, AAAA, CNAME, MX, and TXT records.',
    articles: [
      { id: 'kb_4', title: 'Configuring custom email MX and SPF/DKIM TXT records', readTime: '5 min read' },
      { id: 'kb_5', title: 'Transferring domains without website downtime', readTime: '4 min read' },
      { id: 'kb_6', title: 'Anycast DNS propagation latency and TTL best practices', readTime: '3 min read' },
    ],
  },
  {
    id: 'vps-servers',
    icon: Server,
    title: 'Cloud VPS Management',
    desc: 'SSH keys, firewall rules, root privileges, and server snapshots.',
    articles: [
      { id: 'kb_7', title: 'Connecting to your Cloud VPS using SSH keys', readTime: '4 min read' },
      { id: 'kb_8', title: 'Configuring UFW firewall on Ubuntu / Debian nodes', readTime: '6 min read' },
      { id: 'kb_9', title: 'Restoring an automated snapshot backup', readTime: '3 min read' },
    ],
  },
  {
    id: 'billing',
    icon: CreditCard,
    title: 'Billing & Subscriptions',
    desc: 'Invoices, payment methods, renewal schedules, and plan upgrades.',
    articles: [
      { id: 'kb_10', title: 'Upgrading from monthly to annual billing for discount savings', readTime: '2 min read' },
      { id: 'kb_11', title: 'Downloading and printing official invoice statements', readTime: '2 min read' },
      { id: 'kb_12', title: 'Managing auto-renewal settings for domains and services', readTime: '3 min read' },
    ],
  },
];

export default function KnowledgeBasePage() {
  const { state } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const allArticles = KB_CATEGORIES.flatMap((c) =>
    c.articles.map((a) => ({ ...a, category: c.title }))
  );

  const filteredArticles = search.trim()
    ? allArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.category.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header & Search */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
              Technical Documentation
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Knowledge Base
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Step-by-step technical guides, DNS walkthroughs, and server configuration instructions.
            </p>

            <div className="relative mx-auto max-w-md pt-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search articles (e.g. SSL, DNS, SSH, Backups)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 text-xs bg-white shadow-xs"
              />
            </div>
          </div>

          {/* Search Results Display */}
          {filteredArticles ? (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Search Results ({filteredArticles.length})
              </h2>
              {filteredArticles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                  No articles matched &ldquo;{search}&rdquo;. Try another search term.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredArticles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => setSelectedArticle(art.title)}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 shadow-xs cursor-pointer transition-all space-y-1"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        {art.category}
                      </div>
                      <div className="font-bold text-sm text-slate-900">{art.title}</div>
                      <div className="text-[11px] text-slate-400">{art.readTime}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Categorized Grid */
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {KB_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Card key={cat.id} className="border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900">{cat.title}</h3>
                        <p className="text-xs text-slate-500">{cat.desc}</p>
                      </div>
                    </div>

                    <ul className="divide-y divide-slate-100 text-xs pt-2">
                      {cat.articles.map((art) => (
                        <li
                          key={art.id}
                          onClick={() => setSelectedArticle(art.title)}
                          className="py-3 flex items-center justify-between hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          <span className="font-medium text-slate-700 hover:text-blue-600">{art.title}</span>
                          <span className="text-[11px] text-slate-400 shrink-0 ml-2">{art.readTime}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Modal / Preview dialog when article is clicked */}
          {selectedArticle && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="max-w-lg w-full bg-white p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-base text-slate-900">{selectedArticle}</h3>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    This is an illustrative knowledge base technical guide for <strong>{selectedArticle}</strong>.
                  </p>
                  <p>
                    All commands and steps can be executed through the customer portal terminal or your SSH client. DNS updates take 5-15 minutes to propagate across our Anycast cluster.
                  </p>
                  <div className="rounded-lg bg-slate-900 text-slate-200 p-3 font-mono text-[11px]">
                    # Simulated verification check<br />
                    $ dig +short A yourdomain.com @ns1.cloudvista.host<br />
                    198.51.100.50
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button size="sm" onClick={() => setSelectedArticle(null)} className="text-xs">
                    Close Guide
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  );
}
