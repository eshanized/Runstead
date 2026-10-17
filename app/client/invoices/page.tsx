'use client';

import { useState } from 'react';
import {
  FileText,
  Printer,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
} from 'lucide-react';
import { usePlatformStore } from '@/lib/store/platform-store';
import { formatCurrency } from '@/lib/platform/selectors';
import * as workflows from '@/lib/platform/workflows';
import type { Invoice } from '@/lib/types/platform';
import { ClientPortalLayout } from '@/components/client-portal/client-portal-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ClientInvoicesPage() {
  const { state, syncFromServer } = usePlatformStore();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const activeCustomerId = state.activeClientCustomerId || state.customers[0]?.id;
  const customer = state.customers.find((c: any) => c.id === activeCustomerId) || state.customers[0];

  const myInvoices = state.invoices.filter((i: any) => i.customerId === customer?.id);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  async function handlePay(invoiceId: string) {
    if (!customer) return;
    try {
      const res = await fetch(`/api/portal/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'card' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment processing failed');
      }
      await syncFromServer();
      toast.success('Payment authorized and invoice settled successfully!');
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice((prev) => (prev ? { ...prev, status: 'paid' } : null));
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment processing failed');
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <ClientPortalLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="border-b border-slate-200 pb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Billing History & Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Official billing statements, payment receipts, and settlement status for your account.
          </p>
        </div>

        {myInvoices.length === 0 ? (
          <Card className="border border-dashed border-slate-300 p-12 text-center space-y-3">
            <FileText className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-base text-slate-900">No invoices on file</h3>
            <p className="text-xs text-slate-500">There are no billing records associated with this account.</p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                  <th className="p-4 sm:px-6">Invoice #</th>
                  <th className="p-4 sm:px-6">Issue Date</th>
                  <th className="p-4 sm:px-6">Due Date</th>
                  <th className="p-4 sm:px-6">Amount</th>
                  <th className="p-4 sm:px-6">Status</th>
                  <th className="p-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {myInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 sm:px-6 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="p-4 sm:px-6">{new Date(inv.issueDate).toLocaleDateString()}</td>
                    <td className="p-4 sm:px-6">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="p-4 sm:px-6 font-bold text-slate-950 text-sm">{formatCurrency(inv.total)}</td>
                    <td className="p-4 sm:px-6">
                      <Badge
                        variant={inv.status === 'paid' ? 'default' : 'secondary'}
                        className={`text-[10px] ${
                          inv.status === 'paid'
                            ? 'bg-emerald-600 text-white'
                            : inv.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="p-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedInvoice(inv)}
                          className="h-7 text-xs gap-1 bg-white"
                        >
                          <Eye className="h-3 w-3" /> View
                        </Button>
                        {inv.status !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => handlePay(inv.id)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          >
                            Pay
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Invoice Detail Dialog */}
        {selectedInvoice && (
          <Dialog open={Boolean(selectedInvoice)} onOpenChange={() => setSelectedInvoice(null)}>
            <DialogContent className="max-w-xl p-6 sm:p-8 space-y-6">
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl font-bold text-slate-900">
                      Invoice {selectedInvoice.invoiceNumber}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                      Issued on {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                    </DialogDescription>
                  </div>
                  <Badge
                    variant={selectedInvoice.status === 'paid' ? 'default' : 'secondary'}
                    className={selectedInvoice.status === 'paid' ? 'bg-emerald-600' : ''}
                  >
                    {selectedInvoice.status.toUpperCase()}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Billed To & Brand Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider block text-[10px]">
                    Payable To:
                  </span>
                  <div className="font-bold text-slate-900 mt-1">{config.businessName}</div>
                  <div className="text-slate-500">{config.email}</div>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider block text-[10px]">
                    Billed To:
                  </span>
                  <div className="font-bold text-slate-900 mt-1">{customer?.name}</div>
                  <div className="text-slate-500">{customer?.email}</div>
                  {customer?.company && <div className="text-slate-400">{customer.company}</div>}
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <span className="font-bold text-xs text-slate-900">Line Items</span>
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-xs">
                  {selectedInvoice.lineItems.map((li, idx) => (
                    <div key={idx} className="p-3 flex justify-between text-slate-700">
                      <div>
                        <div className="font-semibold text-slate-900">{li.description}</div>
                        <div className="text-[11px] text-slate-400">Qty: {li.quantity}</div>
                      </div>
                      <div className="font-bold text-slate-900">{formatCurrency(li.total)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-xs text-slate-600 border-t pt-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({selectedInvoice.taxRate}%):</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-950 pt-1 border-t">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2 border-t pt-4">
                <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs gap-1.5">
                  <Printer className="h-3.5 w-3.5" /> Print Statement
                </Button>

                {selectedInvoice.status !== 'paid' ? (
                  <Button
                    size="sm"
                    onClick={() => handlePay(selectedInvoice.id)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    Authorize Payment & Settle Invoice
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 self-center">
                    Paid in Full
                  </Badge>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ClientPortalLayout>
  );
}
