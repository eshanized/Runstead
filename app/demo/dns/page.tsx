'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Network, Plus, Pencil, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DemoShell } from '@/components/demo/demo-shell';
import { DemoPageHeader, DemoEmptyState } from '@/components/demo/demo-helpers';
import { useDemo, generateId } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import type { DnsRecord, DnsRecordType } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

const recordTypes: DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'CAA'];
const ttlOptions = [300, 1800, 3600, 7200, 14400, 86400];

export default function DnsPage() {
  return (
    <DemoShell>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading DNS zones...</div>}>
        <DnsContent />
      </Suspense>
    </DemoShell>
  );
}

function DnsContent() {
  const searchParams = useSearchParams();
  const zoneIdParam = searchParams.get('zoneId');
  const { state, setState } = useDemo();

  const [selectedZoneId, setSelectedZoneId] = useState(
    zoneIdParam || state.dnsZones[0]?.id || ''
  );
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<DnsRecord | null>(null);

  useEffect(() => {
    if (zoneIdParam && state.dnsZones.some((z) => z.id === zoneIdParam)) {
      setSelectedZoneId(zoneIdParam);
    }
  }, [zoneIdParam, state.dnsZones]);

  const zone = state.dnsZones.find((z) => z.id === selectedZoneId) || state.dnsZones[0];

  function handleSave(record: DnsRecord) {
    if (!zone) return;
    try {
      const exists = zone.records.find((r) => r.id === record.id);
      let nextState = state;
      if (exists) {
        nextState = workflows.updateDnsRecord(nextState, {
          zoneId: zone.id,
          recordId: record.id,
          updates: {
            type: record.type,
            host: record.host,
            value: record.value,
            ttl: record.ttl,
            priority: record.priority,
          },
        });
      } else {
        nextState = workflows.addDnsRecord(nextState, {
          zoneId: zone.id,
          type: record.type,
          host: record.host,
          value: record.value,
          ttl: record.ttl,
          priority: record.priority,
        });
      }

      setState(() => nextState);
      setEditingRecord(null);
      setCreateOpen(false);
      toast.success(exists ? 'DNS record updated' : 'DNS record created');
    } catch (err: any) {
      toast.error(err.message || 'Validation failed for DNS record');
    }
  }

  function handleDelete() {
    if (!deleteRecord || !zone) return;
    try {
      const nextState = workflows.deleteDnsRecord(state, {
        zoneId: zone.id,
        recordId: deleteRecord.id,
      });
      setState(() => nextState);
      toast.success('DNS record deleted');
      setDeleteRecord(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (state.dnsZones.length === 0) {
    return (
      <>
        <DemoPageHeader title="DNS Zones" description="Manage DNS records for your domains" />
        <DemoEmptyState
          icon={Network}
          title="No DNS zones"
          description="DNS zones will appear here when domains are registered or connected."
        />
      </>
    );
  }

  return (
    <>
      <DemoPageHeader
        title="DNS Zones"
        description="Edit authoritative DNS records for your connected domains"
        actions={
          zone && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Record
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="w-full sm:w-80">
          <Label className="text-xs text-muted-foreground block mb-1">Select Domain Zone</Label>
          <Select value={zone?.id} onValueChange={setSelectedZoneId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {state.dnsZones.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {z.domain} ({z.records.length} records)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {zone && (
          <div className="text-xs text-muted-foreground">
            Zone: <strong className="text-foreground font-mono">{zone.domain}</strong> &middot;{' '}
            Authoritative Cluster: <span className="text-accent font-medium">PowerDNS (Simulated)</span>
          </div>
        )}
      </div>

      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Strict DNS Record Validation</AlertTitle>
        <AlertDescription>
          Record values for A, AAAA, CNAME, MX, TXT, and CAA are validated against RFC standards. Changes only affect local demo state.
        </AlertDescription>
      </Alert>

      {zone && zone.records.length === 0 ? (
        <DemoEmptyState
          icon={Network}
          title="No records in this zone"
          description="Add your first DNS record to get started."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Record
            </Button>
          }
        />
      ) : zone ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Value / Target</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>TTL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zone.records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {r.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{r.host}</TableCell>
                  <TableCell className="font-mono text-xs max-w-xs truncate text-muted-foreground">
                    {r.value}
                  </TableCell>
                  <TableCell className="text-xs">{r.priority ?? '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{r.ttl}s</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingRecord(r)} aria-label="Edit record">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteRecord(r)} aria-label="Delete record">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : null}

      {editingRecord && zone && (
        <DnsRecordFormDialog
          record={editingRecord}
          zoneId={zone.id}
          onSave={handleSave}
          onClose={() => setEditingRecord(null)}
        />
      )}
      {createOpen && zone && (
        <DnsRecordFormDialog
          zoneId={zone.id}
          onSave={handleSave}
          onClose={() => setCreateOpen(false)}
        />
      )}
      {deleteRecord && (
        <AlertDialog open onOpenChange={() => setDeleteRecord(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete DNS record?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the {deleteRecord.type} record for &quot;{deleteRecord.host}&quot; from the{' '}
                {zone?.domain} zone. This action affects only demo data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Record
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

function DnsRecordFormDialog({
  record,
  zoneId,
  onSave,
  onClose,
}: {
  record?: DnsRecord;
  zoneId: string;
  onSave: (r: DnsRecord) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<DnsRecordType>(record?.type ?? 'A');
  const [host, setHost] = useState(record?.host ?? '@');
  const [value, setValue] = useState(record?.value ?? '');
  const [ttl, setTtl] = useState(record?.ttl ?? 3600);
  const [priority, setPriority] = useState(record?.priority?.toString() ?? '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const pri = type === 'MX' ? (priority ? parseInt(priority, 10) : null) : null;
    const check = workflows.validateDnsRecord(type, host, value, pri);
    if (!check.valid) {
      setErrorMsg(check.error || 'Invalid DNS input');
      return;
    }

    onSave({
      id: record?.id ?? generateId('rec'),
      zoneId,
      type,
      host: host.trim(),
      value: value.trim(),
      ttl,
      priority: pri,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{record ? 'Edit DNS Record' : 'Add DNS Record'}</DialogTitle>
          <DialogDescription>
            Create or modify an authoritative DNS record with strict protocol validation.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Record Type</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as DnsRecordType);
                  setErrorMsg(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recordTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>TTL (Time to Live)</Label>
              <Select value={ttl.toString()} onValueChange={(v) => setTtl(parseInt(v, 10))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ttlOptions.map((t) => (
                    <SelectItem key={t} value={t.toString()}>
                      {t}s ({t >= 3600 ? `${t / 3600}h` : `${t / 60}m`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="host">Host / Name</Label>
            <Input
              id="host"
              value={host}
              onChange={(e) => {
                setHost(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="@ for root domain, or subdomain (e.g. www, mail, api)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Target / Value</Label>
            <Input
              id="value"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={
                type === 'A'
                  ? '198.51.100.1'
                  : type === 'AAAA'
                  ? '2001:db8::1'
                  : type === 'MX'
                  ? 'mail.example.com'
                  : type === 'CAA'
                  ? '0 issue "letsencrypt.org"'
                  : 'Record value string'
              }
            />
          </div>

          {type === 'MX' && (
            <div className="space-y-2">
              <Label htmlFor="priority">MX Priority (0-65535)</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                max="65535"
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="10"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{record ? 'Save Record' : 'Add Record'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
