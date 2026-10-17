'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDemo } from '@/lib/demo/store';
import {
  addDnsRecord,
  updateDnsRecord,
  deleteDnsRecord,
} from '@/lib/demo/workflows';
import { DnsRecord, DnsRecordType, DnsZone } from '@/lib/demo/types';
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
  Network,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Search,
  Server,
  Copy,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const RECORD_TYPES: DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'CAA', 'SRV'];

export default function ServiceDnsPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state, setState } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);

  // Match zone or fallback to first zone or create one
  const zone = useMemo(() => {
    if (!service) return null;
    return (
      state.dnsZones.find((z) => z.domain.toLowerCase() === (service.domain || '').toLowerCase()) ||
      (() => {
        const custDomain = state.domains.find((d) => d.customerId === service.customerId && d.dnsZoneId);
        return custDomain ? state.dnsZones.find((z) => z.id === custDomain.dnsZoneId) : null;
      })() ||
      state.dnsZones[0]
    );
  }, [state.dnsZones, state.domains, service]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Add dialog state
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [newType, setNewType] = useState<DnsRecordType>('A');
  const [newHost, setNewHost] = useState('@');
  const [newValue, setNewValue] = useState(service?.ipAddress || '198.51.100.50');
  const [newTtl, setNewTtl] = useState(3600);
  const [newPriority, setNewPriority] = useState<number | null>(10);

  // Edit dialog state
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null);
  const [editHost, setEditHost] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editTtl, setEditTtl] = useState(3600);
  const [editPriority, setEditPriority] = useState<number | null>(null);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<DnsRecord | null>(null);

  if (!service) {
    return <div className="p-8 text-center text-slate-500">Service not found.</div>;
  }

  const records = zone ? zone.records : [];

  const filteredRecords = records.filter((r) => {
    if (selectedTypeFilter !== 'ALL' && r.type !== selectedTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.host.toLowerCase().includes(q) || r.value.toLowerCase().includes(q);
    }
    return true;
  });

  function handleAddRecord() {
    if (!zone) return;
    try {
      const nextState = addDnsRecord(state, {
        zoneId: zone.id,
        type: newType,
        host: newHost,
        value: newValue,
        ttl: newTtl,
        priority: newType === 'MX' || newType === 'SRV' ? Number(newPriority) : null,
      });
      setState(nextState);
      toast.success(`DNS ${newType} record created.`);
      setAddRecordOpen(false);
      setNewHost('@');
      setNewValue('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add DNS record');
    }
  }

  function handleStartEdit(record: DnsRecord) {
    setEditingRecord(record);
    setEditHost(record.host);
    setEditValue(record.value);
    setEditTtl(record.ttl);
    setEditPriority(record.priority);
  }

  function handleSaveEdit() {
    if (!zone || !editingRecord) return;
    try {
      const nextState = updateDnsRecord(state, {
        zoneId: zone.id,
        recordId: editingRecord.id,
        updates: {
          host: editHost,
          value: editValue,
          ttl: editTtl,
          priority: editingRecord.type === 'MX' ? Number(editPriority) : null,
        },
      });
      setState(nextState);
      toast.success(`Updated ${editingRecord.type} record.`);
      setEditingRecord(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update DNS record');
    }
  }

  function handleDeleteRecord() {
    if (!zone || !deleteTarget) return;
    try {
      const nextState = deleteDnsRecord(state, {
        zoneId: zone.id,
        recordId: deleteTarget.id,
      });
      setState(nextState);
      toast.success(`Deleted ${deleteTarget.type} record.`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete DNS record');
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  }

  return (
    <div className="space-y-6">
      {/* Warning Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-950">Authoritative DNS Zone Modification</p>
          <p className="text-amber-800 leading-relaxed">
            Records modified in this zone are served by authoritative Anycast nameservers. Modifying host IP pointers or MX routing
            can interrupt live website availability or email reception. Propagation takes 15–30 seconds across the cluster.
          </p>
        </div>
      </div>

      {/* Header & Nameservers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Network className="h-5 w-5 text-blue-600" />
                    DNS Zone: {zone ? zone.domain : service.domain}
                  </CardTitle>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    In Sync
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Manage A, AAAA, CNAME, MX, TXT, SRV, and CAA resource records.
                </CardDescription>
              </div>

              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                onClick={() => setAddRecordOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {['ALL', ...RECORD_TYPES].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedTypeFilter(type)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                      selectedTypeFilter === type
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Filter host or value..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-slate-50"
                />
              </div>
            </div>

            {/* Records Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Host / Name</th>
                    <th className="py-2.5 px-3">Target / Value</th>
                    <th className="py-2.5 px-3">TTL</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                        No DNS records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => {
                      const typeColor =
                        rec.type === 'A'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : rec.type === 'AAAA'
                            ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                            : rec.type === 'MX'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : rec.type === 'CNAME'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : rec.type === 'TXT'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200';

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className={`font-mono text-[10px] font-bold ${typeColor}`}>
                              {rec.type}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{rec.host}</td>
                          <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate" title={rec.value}>
                            {rec.type === 'MX' && rec.priority !== null && (
                              <span className="text-purple-600 font-bold mr-1.5">[{rec.priority}]</span>
                            )}
                            {rec.value}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{rec.ttl}s</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-600 hover:text-blue-600"
                                onClick={() => handleStartEdit(rec)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-600 hover:text-rose-600"
                                onClick={() => setDeleteTarget(rec)}
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

        {/* Nameservers Card */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-600" />
              Authoritative Nameservers
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Point your domain registrar to these servers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60 font-mono">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary NS</div>
              <div className="flex justify-between items-center text-slate-900 font-semibold text-xs truncate">
                <span className="truncate">ns1.runstead.tonmoyinfrastructure.org</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 shrink-0 ml-1"
                  onClick={() => copyToClipboard('ns1.runstead.tonmoyinfrastructure.org', 'Primary Nameserver')}
                >
                  <Copy className="h-3 w-3 text-slate-500" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60 font-mono">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secondary NS</div>
              <div className="flex justify-between items-center text-slate-900 font-semibold text-xs truncate">
                <span className="truncate">ns2.runstead.tonmoyinfrastructure.org</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 shrink-0 ml-1"
                  onClick={() => copyToClipboard('ns2.runstead.tonmoyinfrastructure.org', 'Secondary Nameserver')}
                >
                  <Copy className="h-3 w-3 text-slate-500" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/60 p-3 space-y-1 text-emerald-800">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                DNSSEC Enabled
              </div>
              <p className="text-[11px] text-emerald-700">
                Cryptographic signature records are automatically managed for this domain.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Record Dialog */}
      <Dialog open={addRecordOpen} onOpenChange={setAddRecordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add DNS Record</DialogTitle>
            <DialogDescription className="text-xs">
              Configure a new resource record for {zone ? zone.domain : service.domain}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Record Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as DnsRecordType)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-mono"
                >
                  {RECORD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">TTL (Seconds)</label>
                <select
                  value={newTtl}
                  onChange={(e) => setNewTtl(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-mono"
                >
                  <option value={300}>300 (5 mins)</option>
                  <option value={1800}>1800 (30 mins)</option>
                  <option value={3600}>3600 (1 hour)</option>
                  <option value={14400}>14400 (4 hours)</option>
                  <option value={86400}>86400 (1 day)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Host / Name</label>
              <Input
                placeholder="e.g. @, www, mail, api"
                value={newHost}
                onChange={(e) => setNewHost(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-slate-400">Use &quot;@&quot; for apex root domain.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Target / Value</label>
              <Input
                placeholder={newType === 'A' ? 'e.g. 198.51.100.50' : 'e.g. target.domain.com'}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            {(newType === 'MX' || newType === 'SRV') && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Priority</label>
                <Input
                  type="number"
                  placeholder="10"
                  value={newPriority ?? ''}
                  onChange={(e) => setNewPriority(e.target.value ? Number(e.target.value) : null)}
                  className="text-xs font-mono"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setAddRecordOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddRecord} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={Boolean(editingRecord)} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editingRecord?.type} Record</DialogTitle>
            <DialogDescription className="text-xs">
              Modify values for host <span className="font-mono text-slate-900">{editingRecord?.host}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Host / Name</label>
              <Input
                value={editHost}
                onChange={(e) => setEditHost(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Target / Value</label>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">TTL</label>
                <select
                  value={editTtl}
                  onChange={(e) => setEditTtl(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-mono"
                >
                  <option value={300}>300 (5 mins)</option>
                  <option value={1800}>1800 (30 mins)</option>
                  <option value={3600}>3600 (1 hour)</option>
                  <option value={14400}>14400 (4 hours)</option>
                  <option value={86400}>86400 (1 day)</option>
                </select>
              </div>

              {editingRecord?.type === 'MX' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Priority</label>
                  <Input
                    type="number"
                    value={editPriority ?? ''}
                    onChange={(e) => setEditPriority(e.target.value ? Number(e.target.value) : null)}
                    className="text-xs font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setEditingRecord(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Record Confirmation */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete DNS Record
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete the <strong className="font-mono">{deleteTarget?.type}</strong> record for{' '}
              <strong className="font-mono">{deleteTarget?.host}</strong>? This action may interrupt website or mail traffic.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDeleteRecord}>
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
