'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingCart,
  Eye,
  Zap,
  Server,
  FileText,
  AlertTriangle,
  RefreshCw,
  XCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { DemoShell } from '@/components/demo/demo-shell';
import { DemoPageHeader, DemoEmptyState } from '@/components/demo/demo-helpers';
import { useDemo, generateId } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import { searchOrders, filterOrdersByStatus, formatCurrency, formatDateTime, relativeTime } from '@/lib/demo/selectors';
import type { Order, OrderStatus } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const statusFlow: OrderStatus[] = ['awaiting_payment', 'paid', 'provisioning', 'active', 'failed', 'canceled'];

export default function OrdersPage() {
  return (
    <DemoShell>
      <OrdersContent />
    </DemoShell>
  );
}

function OrdersContent() {
  const { state, setState } = useDemo();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    let result = searchOrders(state.orders, search);
    result = filterOrdersByStatus(result, statusFilter);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.orders, search, statusFilter]);

  function handleMarkPaid(order: Order) {
    try {
      let nextState = state;
      if (order.invoiceId) {
        nextState = workflows.markInvoicePaid(nextState, { invoiceId: order.invoiceId });
      } else {
        const updated: Order = {
          ...order,
          status: 'paid',
          updatedAt: new Date().toISOString(),
          events: [
            ...order.events,
            {
              id: generateId('evt'),
              status: 'paid',
              description: 'Payment verified manually by administrator (demo)',
              timestamp: new Date().toISOString(),
            },
          ],
        };
        nextState = {
          ...nextState,
          orders: nextState.orders.map((o) => (o.id === order.id ? updated : o)),
        };
      }

      setState(() => nextState);
      const updatedOrder = nextState.orders.find((o) => o.id === order.id)!;
      setSelectedOrder(updatedOrder);
      toast.success(`Order ${order.orderNumber} marked as paid!`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function handleSimulateProvisioning(order: Order, forceFailure: boolean = false) {
    try {
      const res = workflows.simulateProvisioning(state, {
        orderId: order.id,
        forceFailure,
        failureReason: forceFailure
          ? 'Provisioning node reached quota limit in hypervisor cluster'
          : undefined,
      });

      setState(() => res.state);
      const updatedOrder = res.state.orders.find((o) => o.id === order.id)!;
      setSelectedOrder(updatedOrder);

      if (forceFailure) {
        toast.error(`Provisioning simulated failure recorded for ${order.orderNumber}`);
      } else {
        toast.success(`Service provisioned successfully for ${order.orderNumber}!`);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function handleCancelOrder(order: Order) {
    try {
      const now = new Date().toISOString();
      const updated: Order = {
        ...order,
        status: 'canceled',
        updatedAt: now,
        events: [
          ...order.events,
          {
            id: generateId('evt'),
            status: 'canceled',
            description: 'Order canceled by administrator',
            timestamp: now,
          },
        ],
      };

      // Cancel linked service if active
      let nextServices = state.services;
      if (order.serviceId) {
        nextServices = nextServices.map((s) =>
          s.id === order.serviceId ? { ...s, status: 'canceled' as const } : s
        );
      }

      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => (o.id === order.id ? updated : o)),
        services: nextServices,
      }));

      setSelectedOrder(updated);
      toast.success(`Order ${order.orderNumber} canceled.`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <DemoPageHeader
        title="Orders"
        description={`${state.orders.length} orders in demo order lifecycle`}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order number, customer, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusFlow.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <DemoEmptyState
          icon={ShoppingCart}
          title="No orders found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product / Package</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium font-mono text-xs">{o.orderNumber}</TableCell>
                  <TableCell>{o.customerName}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{o.productName}</TableCell>
                  <TableCell className="text-xs font-semibold">
                    {formatCurrency(o.amount, state.business.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {relativeTime(o.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedOrder(o)}
                      aria-label={`View order ${o.orderNumber}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Order Detail & Provisioning Dialog */}
      {selectedOrder && (
        <Dialog open onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <DialogTitle className="font-mono flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" /> {selectedOrder.orderNumber}
                </DialogTitle>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <DialogDescription>
                Customer: {selectedOrder.customerName} &middot; {selectedOrder.productName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border p-3 bg-muted/20">
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <div className="font-bold text-foreground mt-0.5">
                    {formatCurrency(selectedOrder.amount, state.business.currency)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Cycle:</span>
                  <div className="font-medium capitalize mt-0.5">
                    {selectedOrder.billingCycle.replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div className="font-medium mt-0.5">{formatDateTime(selectedOrder.createdAt)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Updated:</span>
                  <div className="font-medium mt-0.5">{relativeTime(selectedOrder.updatedAt)}</div>
                </div>
              </div>

              {/* Linked Records Navigation */}
              <div className="grid grid-cols-2 gap-2">
                {selectedOrder.invoiceId && (
                  <div className="rounded-lg border p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Linked Invoice</span>
                      <span className="font-mono font-medium">View Invoice</span>
                    </div>
                    <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                      <Link href="/demo/invoices">
                        <FileText className="mr-1 h-3 w-3" /> Invoices
                      </Link>
                    </Button>
                  </div>
                )}
                {selectedOrder.serviceId && (
                  <div className="rounded-lg border p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Active Service</span>
                      <span className="font-mono font-medium">Provisioned</span>
                    </div>
                    <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                      <Link href="/demo/services">
                        <Server className="mr-1 h-3 w-3" /> Services
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Order Timeline Events */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Order Lifecycle Timeline
                </h4>
                <div className="space-y-2 rounded-lg border p-3 bg-card max-h-48 overflow-y-auto">
                  {selectedOrder.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start justify-between border-b pb-2 last:border-0 last:pb-0"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={ev.status} />
                          <span className="font-medium text-foreground">{ev.description}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                        {relativeTime(ev.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lifecycle Action Buttons */}
            <DialogFooter className="flex-wrap gap-2 pt-2 border-t">
              {selectedOrder.status === 'awaiting_payment' && (
                <Button size="sm" onClick={() => handleMarkPaid(selectedOrder)}>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Confirm Payment (Simulated)
                </Button>
              )}

              {(selectedOrder.status === 'paid' || selectedOrder.status === 'provisioning') && (
                <>
                  <Button
                    size="sm"
                    className="bg-primary"
                    onClick={() => handleSimulateProvisioning(selectedOrder, false)}
                  >
                    <Zap className="mr-1.5 h-3.5 w-3.5" /> Simulate Provisioning
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-600 border-amber-300"
                    onClick={() => handleSimulateProvisioning(selectedOrder, true)}
                  >
                    Simulate Failure Demo
                  </Button>
                </>
              )}

              {selectedOrder.status === 'failed' && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  onClick={() => handleSimulateProvisioning(selectedOrder, false)}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry Provisioning
                </Button>
              )}

              {selectedOrder.status !== 'canceled' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleCancelOrder(selectedOrder)}
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" /> Cancel Order
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
