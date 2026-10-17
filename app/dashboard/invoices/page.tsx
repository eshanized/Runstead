'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, FileText, Eye, CheckCircle, DollarSign, XCircle, Printer, ExternalLink } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardPageHeader, DashboardEmptyState } from '@/components/dashboard/dashboard-helpers';
import { useDemo } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import { searchInvoices, filterInvoicesByStatus, formatCurrency, formatDate } from '@/lib/demo/selectors';
import type { Invoice } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function InvoicesPage() {
  return (
    <DashboardShell>
      <InvoicesContent />
    </DashboardShell>
  );
}

function InvoicesContent() {
  const { state, setState, syncFromServer } = useDemo();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const selectedInvoice = useMemo(() => {
    return state.invoices.find((i) => i.id === selectedInvoiceId) ?? null;
  }, [state.invoices, selectedInvoiceId]);

  const filtered = useMemo(() => {
    let result = searchInvoices(state.invoices, search);
    result = filterInvoicesByStatus(result, statusFilter);
    return result.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [state.invoices, search, statusFilter]);

  async function handleMarkPaid(invoice: Invoice) {
    try {
      const res = await fetch(`/api/reseller/invoices/${invoice.id}/pay?tenantId=default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: invoice.total,
          method: 'Manual Staff Confirmation',
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to settle invoice');

      await syncFromServer();
      toast.success(`Invoice ${invoice.invoiceNumber} recorded as paid in database.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark invoice paid');
    }
  }

  function handleVoid(invoice: Invoice) {
    if (!confirm(`Void invoice ${invoice.invoiceNumber}?`)) return;
    try {
      setState((prev) => workflows.voidInvoice(prev, { invoiceId: invoice.id }));
      toast.success(`Invoice ${invoice.invoiceNumber} voided`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to void invoice');
    }
  }

  function handleRefund(invoice: Invoice) {
    if (!confirm(`Process refund of ${formatCurrency(invoice.total, invoice.currency)} for ${invoice.invoiceNumber}? This is a simulated action.`)) return;
    try {
      setState((prev) => workflows.refundInvoice(prev, { invoiceId: invoice.id, reason: 'Staff administrative refund' }));
      toast.success(`Refund recorded for ${invoice.invoiceNumber}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to process refund');
    }
  }

  // Find linked order if any
  const linkedOrder = useMemo(() => {
    if (!selectedInvoice) return null;
    return state.orders.find((o) => o.invoiceId === selectedInvoice.id || selectedInvoice.lineItems.some((li) => li.description.includes(o.productName)));
  }, [state.orders, selectedInvoice]);

  return (
    <>
      <DashboardPageHeader title="Invoices" description={`${state.invoices.length} invoices recorded in financial ledger`} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by invoice number or customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="void">Void</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <DashboardEmptyState icon={FileText} title="No invoices found" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/customers?search=${encodeURIComponent(inv.customerName)}`} className="hover:underline">
                      {inv.customerName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(inv.issueDate)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(inv.total, inv.currency)}</TableCell>
                  <TableCell><StatusBadge status={inv.status} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedInvoiceId(inv.id)} aria-label={`View invoice ${inv.invoiceNumber}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {selectedInvoice && (
        <Dialog open onOpenChange={(open) => { if (!open) setSelectedInvoiceId(null); }}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  {selectedInvoice.invoiceNumber}
                </DialogTitle>
                <StatusBadge status={selectedInvoice.status} />
              </div>
              <DialogDescription>
                Billed to <span className="font-semibold text-foreground">{selectedInvoice.customerName}</span> &bull; {state.business.businessName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-3 bg-muted/20 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Issue Date</span>
                  <div className="font-medium">{formatDate(selectedInvoice.issueDate)}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Due Date</span>
                  <div className="font-medium">{formatDate(selectedInvoice.dueDate)}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Payment Status</span>
                  <div className="font-medium capitalize">{selectedInvoice.status}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Currency</span>
                  <div className="font-medium">{selectedInvoice.currency}</div>
                </div>
              </div>

              {linkedOrder && (
                <div className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent/5 p-2.5 text-xs">
                  <span>Linked Order: <strong>{linkedOrder.orderNumber}</strong> ({linkedOrder.productName})</span>
                  <Link href="/dashboard/orders" className="text-accent hover:underline flex items-center gap-1 font-medium">
                    View Order <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2">Line Items</h4>
                <div className="space-y-2 border rounded-lg p-3">
                  {selectedInvoice.lineItems.map((li) => (
                    <div key={li.id} className="flex justify-between items-center text-sm py-1 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">{li.description}</div>
                        <div className="text-xs text-muted-foreground">Qty: {li.quantity} &times; {formatCurrency(li.unitPrice, selectedInvoice.currency)}</div>
                      </div>
                      <span className="font-semibold">{formatCurrency(li.total, selectedInvoice.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-sm rounded-lg border p-3 bg-card">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Tax ({selectedInvoice.taxRate}%)</span>
                  <span>{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold text-foreground pt-1">
                  <span>Total Amount</span>
                  <span>{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
                </div>
              </div>

              {selectedInvoice.payments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Recorded Payments (Simulated)</h4>
                  <div className="space-y-1 rounded-lg border p-2.5 text-xs">
                    {selectedInvoice.payments.map((p) => (
                      <div key={p.id} className="flex justify-between py-1 border-b last:border-b-0">
                        <span>{p.method} &bull; {formatDate(p.date)}</span>
                        <span className="font-semibold text-success">{formatCurrency(p.amount, selectedInvoice.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-wrap gap-2 sm:justify-between pt-3">
              <div className="flex items-center gap-2">
                {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'void' && selectedInvoice.status !== 'refunded' && (
                  <Button size="sm" onClick={() => handleMarkPaid(selectedInvoice)}>
                    <CheckCircle className="mr-1.5 h-4 w-4" /> Mark Paid
                  </Button>
                )}
                {selectedInvoice.status === 'paid' && (
                  <Button variant="outline" size="sm" onClick={() => handleRefund(selectedInvoice)}>
                    <DollarSign className="mr-1.5 h-4 w-4" /> Refund
                  </Button>
                )}
                {selectedInvoice.status !== 'void' && selectedInvoice.status !== 'refunded' && (
                  <Button variant="outline" size="sm" onClick={() => handleVoid(selectedInvoice)}>
                    <XCircle className="mr-1.5 h-4 w-4" /> Void
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-1.5 h-4 w-4" /> Print
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedInvoiceId(null)}>Close</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
