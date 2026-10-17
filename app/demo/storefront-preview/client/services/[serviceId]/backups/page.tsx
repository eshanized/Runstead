'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDemo } from '@/lib/demo/store';
import {
  createServiceBackup,
  restoreServiceBackup,
  deleteServiceBackup,
} from '@/lib/demo/workflows';
import { ServiceBackup } from '@/lib/demo/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Archive,
  Plus,
  RotateCcw,
  Trash2,
  Download,
  AlertTriangle,
  HardDrive,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Server,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceBackupsPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state, setState } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);

  // Modal states
  const [createBackupOpen, setCreateBackupOpen] = useState(false);
  const [backupScope, setBackupScope] = useState<'full' | 'database' | 'files'>('full');
  const [restoreTarget, setRestoreTarget] = useState<ServiceBackup | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceBackup | null>(null);

  if (!service) {
    return <div className="p-8 text-center text-slate-500">Service not found.</div>;
  }

  const backups = service.backups || [];

  function handleCreateBackup() {
    try {
      const nextState = createServiceBackup(state, service!.id, backupScope);
      setState(nextState);
      toast.success(`Manual ${backupScope} snapshot created successfully.`);
      setCreateBackupOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error creating backup');
    }
  }

  function handleConfirmRestore() {
    if (!restoreTarget) return;
    setRestoring(true);
    toast.info(`Initiating restore point for ${restoreTarget.filename}...`);

    setTimeout(() => {
      try {
        const nextState = restoreServiceBackup(state, service!.id, restoreTarget.id);
        setState(nextState);
        toast.success(`Service restored successfully from ${restoreTarget.filename}`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Restore failed');
      } finally {
        setRestoring(false);
        setRestoreTarget(null);
      }
    }, 1200);
  }

  function handleDeleteBackup() {
    if (!deleteTarget) return;
    try {
      const nextState = deleteServiceBackup(state, service!.id, deleteTarget.id);
      setState(nextState);
      toast.success('Backup snapshot deleted.');
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete backup');
    }
  }

  function handleDownloadMock(backup: ServiceBackup) {
    const mockContent = `RUNSTEAD_ARCHIVE_MOCK_HEADER\nService: ${service!.domain}\nScope: ${backup.scope}\nCreated: ${backup.createdAt}\n`;
    const blob = new Blob([mockContent], { type: 'application/gzip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backup.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${backup.filename}`);
  }

  return (
    <div className="space-y-8">
      {/* Overview & Create Backup Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Archive className="h-5 w-5 text-amber-600" />
                    Backups & Restore Points
                  </CardTitle>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    Encrypted Offsite Storage
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Point-in-time disaster recovery snapshots for database, web files, and configurations.
                </CardDescription>
              </div>

              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                onClick={() => setCreateBackupOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create Backup Now
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {/* Backups Inventory Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <th className="py-2.5 px-3">Snapshot Archive</th>
                    <th className="py-2.5 px-3">Scope</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {backups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                        No backup archives available. Click &quot;Create Backup Now&quot; above.
                      </td>
                    </tr>
                  ) : (
                    backups.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                          <Archive className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span className="truncate max-w-[200px]" title={bk.filename}>
                            {bk.filename}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant="secondary"
                            className="font-sans text-[10px] uppercase font-bold tracking-wider"
                          >
                            {bk.scope}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{bk.sizeMB} MB</td>
                        <td className="py-3 px-3 text-slate-500 font-sans text-xs">
                          {bk.createdAt ? new Date(bk.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                              onClick={() => setRestoreTarget(bk)}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restore
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-600 hover:text-emerald-600"
                              title="Download Archive"
                              onClick={() => handleDownloadMock(bk)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-600 hover:text-rose-600"
                              title="Delete Archive"
                              onClick={() => setDeleteTarget(bk)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Retention Policies */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Automated Snapshot Schedule
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Recurring automated backup schedule.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs font-mono">
            <div className="space-y-1 p-3 rounded-lg bg-slate-50 border border-slate-200/60 font-sans">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Frequency</div>
              <div className="text-slate-900 font-bold">Daily at 03:00 UTC (Off-Peak)</div>
              <p className="text-[11px] text-slate-500">Non-locking snapshot with zero customer downtime.</p>
            </div>

            <div className="space-y-1 p-3 rounded-lg bg-slate-50 border border-slate-200/60 font-sans">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retention Window</div>
              <div className="text-slate-900 font-bold">30 Rolling Daily Restore Points</div>
            </div>

            <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/60 p-3 space-y-1 font-sans text-emerald-900">
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Air-Gapped S3 Storage
              </div>
              <p className="text-[11px] text-emerald-800">
                Snapshots are replicated to an isolated cloud object vault protected against ransomware.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Backup Dialog */}
      <Dialog open={createBackupOpen} onOpenChange={setCreateBackupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Manual Backup</DialogTitle>
            <DialogDescription className="text-xs">
              Generate an immediate point-in-time recovery snapshot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Backup Scope</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'full', label: 'Full System', desc: 'Files + DB' },
                  { id: 'database', label: 'Database Only', desc: 'MySQL dump' },
                  { id: 'files', label: 'Web Files Only', desc: 'public_html' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setBackupScope(s.id as 'full' | 'database' | 'files')}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      backupScope === s.id
                        ? 'border-amber-500 bg-amber-50/60 text-amber-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">{s.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setCreateBackupOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateBackup} className="bg-amber-600 hover:bg-amber-700 text-white">
              Start Backup Snapshot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={Boolean(restoreTarget)} onOpenChange={(open) => !open && setRestoreTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Restore Service Snapshot
            </DialogTitle>
            <DialogDescription className="text-xs">
              Restoring snapshot <strong className="font-mono text-slate-900">{restoreTarget?.filename}</strong> will overwrite current
              active files and tables with this restore point.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="outline" disabled={restoring} onClick={() => setRestoreTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={restoring}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleConfirmRestore}
            >
              {restoring ? 'Restoring System...' : 'Confirm & Restore Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Backup Confirmation */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Backup Archive
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to permanently delete archive <strong className="font-mono text-slate-900">{deleteTarget?.filename}</strong>?
              This snapshot will no longer be available for disaster recovery.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDeleteBackup}>
              Delete Snapshot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
