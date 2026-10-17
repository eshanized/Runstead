'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDemo } from '@/lib/demo/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Folder,
  ArrowRight,
  Server,
  Code,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface SubdomainItem {
  id: string;
  name: string;
  documentRoot: string;
  phpVersion: string;
  sslActive: boolean;
}

export default function ServiceDomainsPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);

  // Subdomains service state (persists in session)
  const [subdomains, setSubdomains] = useState<SubdomainItem[]>([
    {
      id: 'sub_1',
      name: `staging.${service?.domain || 'example.com'}`,
      documentRoot: '/public_html/staging',
      phpVersion: 'PHP 8.3',
      sslActive: true,
    },
    {
      id: 'sub_2',
      name: `api.${service?.domain || 'example.com'}`,
      documentRoot: '/public_html/api',
      phpVersion: 'PHP 8.2',
      sslActive: true,
    },
  ]);

  const [addSubOpen, setAddSubOpen] = useState(false);
  const [newSubPrefix, setNewSubPrefix] = useState('');
  const [newSubDocRoot, setNewSubDocRoot] = useState('');

  const [aliases, setAliases] = useState<string[]>([
    `www.${service?.domain || 'example.com'}`,
  ]);
  const [addAliasOpen, setAddAliasOpen] = useState(false);
  const [newAliasName, setNewAliasName] = useState('');

  if (!service) {
    return <div className="p-8 text-center text-slate-500">Service not found.</div>;
  }

  function handleCreateSubdomain() {
    if (!newSubPrefix.trim()) {
      toast.error('Please enter a subdomain prefix.');
      return;
    }
    const cleanPrefix = newSubPrefix.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const fullName = `${cleanPrefix}.${service!.domain}`;
    const docRoot = newSubDocRoot.trim() || `/public_html/${cleanPrefix}`;

    setSubdomains((prev) => [
      ...prev,
      {
        id: `sub_${Date.now()}`,
        name: fullName,
        documentRoot: docRoot,
        phpVersion: 'PHP 8.3',
        sslActive: true,
      },
    ]);

    toast.success(`Subdomain "${fullName}" created successfully.`);
    setAddSubOpen(false);
    setNewSubPrefix('');
    setNewSubDocRoot('');
  }

  function handleDeleteSubdomain(id: string) {
    setSubdomains((prev) => prev.filter((s) => s.id !== id));
    toast.success('Subdomain deleted.');
  }

  function handleAddAlias() {
    if (!newAliasName.trim()) {
      toast.error('Please enter alias domain name.');
      return;
    }
    const cleanName = newAliasName.trim().toLowerCase();
    setAliases((prev) => [...prev, cleanName]);
    toast.success(`Alias "${cleanName}" registered.`);
    setAddAliasOpen(false);
    setNewAliasName('');
  }

  return (
    <div className="space-y-8">
      {/* Primary Domain Card */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Primary Domain Routing
                </CardTitle>
                <Badge className="bg-emerald-600 text-white text-[10px]">Active</Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Primary apex hostname and web root directory binding.
              </CardDescription>
            </div>

            <Button asChild size="sm" variant="outline" className="text-xs gap-1.5">
              <Link href={`/client/services/${service.id}/dns`}>
                Open DNS Zone Editor <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 font-mono">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Domain</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{service.domain}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Document Root</span>
              <span className="text-slate-700 text-xs mt-1 block">/public_html</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PHP Runtime</span>
              <span className="text-slate-700 text-xs mt-1 block">PHP 8.3 (FPM)</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SSL Certificate</span>
              <span className="text-emerald-700 font-semibold text-xs mt-1 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Let&apos;s Encrypt TLS
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subdomains Section */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Folder className="h-4 w-4 text-amber-500" />
                Subdomains
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Route secondary hostnames to dedicated folders inside your web root.
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
              onClick={() => setAddSubOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Create Subdomain
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="py-2.5 px-3">Subdomain Hostname</th>
                  <th className="py-2.5 px-3">Document Root</th>
                  <th className="py-2.5 px-3">PHP Version</th>
                  <th className="py-2.5 px-3">SSL Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {subdomains.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 font-sans">
                      No subdomains created yet.
                    </td>
                  </tr>
                ) : (
                  subdomains.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-bold text-slate-900">{sub.name}</td>
                      <td className="py-3 px-3 text-slate-600">{sub.documentRoot}</td>
                      <td className="py-3 px-3 text-slate-600">{sub.phpVersion}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                          Active
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-slate-600 hover:text-rose-600"
                          onClick={() => handleDeleteSubdomain(sub.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Domain Aliases Section */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-600" />
                Domain Aliases (Parked Domains)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Alternative domains that mirror the primary website without redirection.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              onClick={() => setAddAliasOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 text-purple-600" />
              Add Domain Alias
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="py-2.5 px-3">Alias Domain</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {aliases.map((alias, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-bold text-slate-900">{alias}</td>
                    <td className="py-3 px-3 text-slate-600">{service.domain} (Mirror)</td>
                    <td className="py-3 px-3 text-right">
                      {idx > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-slate-600 hover:text-rose-600"
                          onClick={() => setAliases((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Subdomain Dialog */}
      <Dialog open={addSubOpen} onOpenChange={setAddSubOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Subdomain</DialogTitle>
            <DialogDescription className="text-xs">
              Add a subdomain pointing to a directory in your hosting environment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Subdomain Prefix</label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g. blog, test"
                  value={newSubPrefix}
                  onChange={(e) => setNewSubPrefix(e.target.value)}
                  className="text-xs font-mono"
                />
                <span className="text-xs text-slate-500 font-mono">.{service.domain}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Document Root (Optional)</label>
              <Input
                placeholder={`/public_html/${newSubPrefix || 'subdomain'}`}
                value={newSubDocRoot}
                onChange={(e) => setNewSubDocRoot(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setAddSubOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateSubdomain} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create Subdomain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Alias Dialog */}
      <Dialog open={addAliasOpen} onOpenChange={setAddAliasOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Domain Alias</DialogTitle>
            <DialogDescription className="text-xs">
              Alias domain must point its nameservers or A record to this server IP ({service.ipAddress}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Alias Domain Name</label>
              <Input
                placeholder="e.g. mycompany.net"
                value={newAliasName}
                onChange={(e) => setNewAliasName(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setAddAliasOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddAlias} className="bg-purple-600 hover:bg-purple-700 text-white">
              Save Alias
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
