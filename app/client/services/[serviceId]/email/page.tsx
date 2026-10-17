'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDemo } from '@/lib/demo/store';
import {
  createServiceEmailAccount,
  deleteServiceEmailAccount,
  createServiceEmailForwarder,
  deleteServiceEmailForwarder,
} from '@/lib/demo/workflows';
import { ServiceEmailAccount, ServiceEmailForwarder } from '@/lib/demo/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  KeyRound,
  Forward,
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceEmailPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state, setState } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);

  // Mailbox states
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [newEmailUser, setNewEmailUser] = useState('');
  const [newEmailPassword, setNewEmailPassword] = useState('');
  const [newEmailQuotaMB, setNewEmailQuotaMB] = useState(1024);

  // Forwarder states
  const [createForwarderOpen, setCreateForwarderOpen] = useState(false);
  const [newFwdSource, setNewFwdSource] = useState('');
  const [newFwdDest, setNewFwdDest] = useState('');

  // Target for delete
  const [deleteAccountTarget, setDeleteAccountTarget] = useState<ServiceEmailAccount | null>(null);
  const [deleteFwdTarget, setDeleteFwdTarget] = useState<ServiceEmailForwarder | null>(null);

  if (!service) {
    return <div className="p-8 text-center text-slate-500">Service not found.</div>;
  }

  const emailAccounts = service.emailAccounts || [];
  const forwarders = service.emailForwarders || [];
  const maxAccounts = service.planLimits?.emailAccounts || 5;
  const quotaPercent = Math.min(100, Math.round((emailAccounts.length / maxAccounts) * 100));

  function handleCreateAccount() {
    if (!newEmailUser.trim()) {
      toast.error('Please enter a mailbox name.');
      return;
    }
    const cleanAddress = `${newEmailUser.trim().toLowerCase()}@${service!.domain}`;
    try {
      const nextState = createServiceEmailAccount(state, service!.id, cleanAddress, newEmailQuotaMB);
      setState(nextState);
      toast.success(`Mailbox ${cleanAddress} created.`);
      setCreateAccountOpen(false);
      setNewEmailUser('');
      setNewEmailPassword('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create mailbox');
    }
  }

  function handleDeleteAccount() {
    if (!deleteAccountTarget) return;
    try {
      const nextState = deleteServiceEmailAccount(state, service!.id, deleteAccountTarget.id);
      setState(nextState);
      toast.success(`Mailbox ${deleteAccountTarget.address} deleted.`);
      setDeleteAccountTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete mailbox');
    }
  }

  function handleCreateForwarder() {
    if (!newFwdSource.trim() || !newFwdDest.trim()) {
      toast.error('Please fill in both source and destination email.');
      return;
    }
    const src = newFwdSource.includes('@') ? newFwdSource.trim() : `${newFwdSource.trim()}@${service!.domain}`;
    try {
      const nextState = createServiceEmailForwarder(state, service!.id, src, newFwdDest.trim());
      setState(nextState);
      toast.success(`Forwarder created: ${src} -> ${newFwdDest.trim()}`);
      setCreateForwarderOpen(false);
      setNewFwdSource('');
      setNewFwdDest('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create forwarder');
    }
  }

  function handleDeleteForwarder() {
    if (!deleteFwdTarget) return;
    try {
      const nextState = deleteServiceEmailForwarder(state, service!.id, deleteFwdTarget.id);
      setState(nextState);
      toast.success('Forwarder removed.');
      setDeleteFwdTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove forwarder');
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  }

  return (
    <div className="space-y-8">
      {/* Top Section: Accounts and Setup Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Mailboxes & Domain Email
                  </CardTitle>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    IMAP / SMTP Ready
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Manage individual mail accounts, storage quotas, and security credentials.
                </CardDescription>
              </div>

              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                disabled={emailAccounts.length >= maxAccounts}
                onClick={() => setCreateAccountOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create Mailbox
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {/* Quota Progress */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Account Quota Allocation</span>
                <span className="font-mono text-slate-600">
                  {emailAccounts.length} of {maxAccounts} Mailboxes Active ({quotaPercent}%)
                </span>
              </div>
              <Progress value={quotaPercent} className="h-2" />
            </div>

            {/* Mailboxes Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Usage / Quota</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {emailAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No mailboxes configured. Click &quot;Create Mailbox&quot; above.
                      </td>
                    </tr>
                  ) : (
                    emailAccounts.map((acc) => {
                      const usagePercent = Math.min(100, Math.round((acc.usedMB / acc.quotaMB) * 100));
                      return (
                        <tr key={acc.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-blue-500" />
                            {acc.address}
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-1 max-w-[140px]">
                              <div className="flex justify-between text-[11px] font-mono text-slate-600">
                                <span>{acc.usedMB} MB</span>
                                <span>{acc.quotaMB} MB</span>
                              </div>
                              <Progress value={usagePercent} className="h-1.5" />
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                              {acc.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => toast.info(`Webmail SSO login session launched for ${acc.address}`)}
                              >
                                Webmail
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-600 hover:text-rose-600"
                                onClick={() => setDeleteAccountTarget(acc)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Mail Client Instructions */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" />
              Client Setup (Thunderbird / Outlook)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Encrypted SSL/TLS connection parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-mono">
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IMAP Server (Incoming)</div>
              <div className="flex justify-between items-center text-slate-900 font-semibold text-xs truncate">
                <span className="truncate">mail.runstead.tonmoyinfrastructure.org</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 shrink-0 ml-1"
                  onClick={() => copyToClipboard('mail.runstead.tonmoyinfrastructure.org', 'IMAP Server')}
                >
                  <Copy className="h-3 w-3 text-slate-500" />
                </Button>
              </div>
              <div className="text-[11px] text-slate-500 font-sans">Port: 993 (SSL/TLS)</div>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SMTP Server (Outgoing)</div>
              <div className="flex justify-between items-center text-slate-900 font-semibold text-xs truncate">
                <span className="truncate">mail.runstead.tonmoyinfrastructure.org</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 shrink-0 ml-1"
                  onClick={() => copyToClipboard('mail.runstead.tonmoyinfrastructure.org', 'SMTP Server')}
                >
                  <Copy className="h-3 w-3 text-slate-500" />
                </Button>
              </div>
              <div className="text-[11px] text-slate-500 font-sans">Port: 465 (SSL/TLS) • Auth Required</div>
            </div>

            <div className="rounded-lg bg-blue-50/60 border border-blue-200/60 p-3 space-y-1 font-sans text-blue-900">
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                DKIM & SPF Configured
              </div>
              <p className="text-[11px] text-blue-800">
                Outbound mail passes anti-spam checks with preconfigured cryptographic signatures.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forwarders & Aliases Section */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Forward className="h-4 w-4 text-purple-600" />
                Email Forwarders & Aliases
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Automatically redirect incoming messages to external or internal recipients.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              onClick={() => setCreateForwarderOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 text-purple-600" />
              Add Forwarder
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="py-2.5 px-3">Source Address</th>
                  <th className="py-2.5 px-3">Forward Destination</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {forwarders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400 font-sans">
                      No forwarders configured. Click &quot;Add Forwarder&quot; above.
                    </td>
                  </tr>
                ) : (
                  forwarders.map((fwd) => (
                    <tr key={fwd.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-bold text-slate-900">{fwd.source}</td>
                      <td className="py-3 px-3 text-purple-700 flex items-center gap-1.5">
                        <Forward className="h-3.5 w-3.5 text-purple-500" />
                        {fwd.destination}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-slate-600 hover:text-rose-600"
                          onClick={() => setDeleteFwdTarget(fwd)}
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

      {/* Create Account Dialog */}
      <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Mailbox</DialogTitle>
            <DialogDescription className="text-xs">
              Provision a new mailbox on domain <span className="font-mono text-slate-900">{service.domain}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Mailbox User</label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g. contact, alex"
                  value={newEmailUser}
                  onChange={(e) => setNewEmailUser(e.target.value)}
                  className="text-xs font-mono"
                />
                <span className="text-xs font-mono text-slate-500">@{service.domain}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={newEmailPassword}
                onChange={(e) => setNewEmailPassword(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Storage Quota (MB)</label>
              <Input
                type="number"
                value={newEmailQuotaMB}
                onChange={(e) => setNewEmailQuotaMB(Number(e.target.value))}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setCreateAccountOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateAccount} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create Mailbox
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Forwarder Dialog */}
      <Dialog open={createForwarderOpen} onOpenChange={setCreateForwarderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Email Forwarder</DialogTitle>
            <DialogDescription className="text-xs">
              Route mail sent to this domain to another inbox.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Source Address</label>
              <Input
                placeholder={`e.g. info@${service.domain}`}
                value={newFwdSource}
                onChange={(e) => setNewFwdSource(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Forward Destination</label>
              <Input
                placeholder="e.g. personal@gmail.com"
                value={newFwdDest}
                onChange={(e) => setNewFwdDest(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setCreateForwarderOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateForwarder} className="bg-purple-600 hover:bg-purple-700 text-white">
              Save Forwarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <Dialog open={Boolean(deleteAccountTarget)} onOpenChange={(open) => !open && setDeleteAccountTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Mailbox
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete mailbox <strong className="font-mono text-slate-900">{deleteAccountTarget?.address}</strong>?
              All stored emails, folders, and settings will be permanently destroyed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setDeleteAccountTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDeleteAccount}>
              Delete Mailbox
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Forwarder Confirmation */}
      <Dialog open={Boolean(deleteFwdTarget)} onOpenChange={(open) => !open && setDeleteFwdTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Remove Forwarder
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to remove forwarder from <strong className="font-mono text-slate-900">{deleteFwdTarget?.source}</strong> to{' '}
              <strong className="font-mono text-slate-900">{deleteFwdTarget?.destination}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setDeleteFwdTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDeleteForwarder}>
              Remove Forwarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
