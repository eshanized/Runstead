'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Users,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
  Archive,
  Server,
  ShoppingCart,
  FileText,
  LifeBuoy,
  Globe,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { DemoShell } from '@/components/demo/demo-shell';
import { DemoPageHeader, DemoEmptyState } from '@/components/demo/demo-helpers';
import { useDemo, generateId } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import {
  searchCustomers,
  filterCustomersByStatus,
  sortCustomers,
  paginate,
  totalPages,
  formatCurrency,
  formatDate,
  relativeTime,
} from '@/lib/demo/selectors';
import type { Customer } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const PER_PAGE = 5;

export default function CustomersPage() {
  return (
    <DemoShell>
      <CustomersContent />
    </DemoShell>
  );
}

function CustomersContent() {
  const { state, setState } = useDemo();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = searchCustomers(state.customers, search);
    result = filterCustomersByStatus(result, statusFilter);
    result = sortCustomers(result, sortBy, sortAsc);
    return result;
  }, [state.customers, search, statusFilter, sortBy, sortAsc]);

  const paged = paginate(filtered, page, PER_PAGE);
  const tp = totalPages(filtered.length, PER_PAGE);

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  }

  function handleArchive(customer: Customer) {
    try {
      const nextState = workflows.archiveCustomer(state, customer.id);
      setState(() => nextState);
      const updated = nextState.customers.find((c) => c.id === customer.id)!;
      setSelectedCustomer(updated);
      toast.success(`Customer ${customer.name} archived safely.`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function handleDelete(customer: Customer) {
    try {
      const nextState = workflows.deleteCustomer(state, customer.id);
      setState(() => nextState);
      setSelectedCustomer(null);
      toast.success(`Customer ${customer.name} deleted.`);
    } catch (err: any) {
      // If blocked by active dependencies, offer to archive instead
      toast.error(err.message, {
        action: {
          label: 'Archive Instead',
          onClick: () => handleArchive(customer),
        },
      });
    }
  }

  function handleSave(customer: Customer) {
    try {
      const nextState = workflows.updateCustomer(state, customer.id, customer);
      setState(() => nextState);
      setEditCustomer(null);
      toast.success('Customer profile updated.');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function handleCreate(data: { name: string; email: string; company?: string; country?: string; phone?: string }) {
    try {
      const nextState = workflows.createCustomer(state, data);
      setState(() => nextState);
      setCreateOpen(false);
      toast.success(`Customer ${data.name} created.`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // Related collections for selected customer
  const customerServices = useMemo(() => {
    if (!selectedCustomer) return [];
    return state.services.filter((s) => s.customerId === selectedCustomer.id);
  }, [state.services, selectedCustomer]);

  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return state.orders.filter((o) => o.customerId === selectedCustomer.id);
  }, [state.orders, selectedCustomer]);

  const customerInvoices = useMemo(() => {
    if (!selectedCustomer) return [];
    return state.invoices.filter((i) => i.customerId === selectedCustomer.id);
  }, [state.invoices, selectedCustomer]);

  const customerTickets = useMemo(() => {
    if (!selectedCustomer) return [];
    return state.tickets.filter((t) => t.customerId === selectedCustomer.id);
  }, [state.tickets, selectedCustomer]);

  const customerDomains = useMemo(() => {
    if (!selectedCustomer) return [];
    return state.domains.filter((d) => d.customerId === selectedCustomer.id);
  }, [state.domains, selectedCustomer]);

  return (
    <>
      <DemoPageHeader
        title="Customers"
        description={`${state.customers.length} customer accounts in demo registry`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, company, or country..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <DemoEmptyState
          icon={Users}
          title="No customers found"
          description="Try adjusting your search query or filters."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1 font-semibold hover:text-foreground"
                    aria-label="Sort by customer name"
                  >
                    Name <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort('email')}
                    className="flex items-center gap-1 font-semibold hover:text-foreground"
                    aria-label="Sort by email"
                  >
                    Email <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort('servicesCount')}
                    className="flex items-center gap-1 font-semibold hover:text-foreground"
                    aria-label="Sort by services count"
                  >
                    Services <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort('totalRevenue')}
                    className="flex items-center gap-1 font-semibold hover:text-foreground"
                    aria-label="Sort by revenue"
                  >
                    Revenue <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>{c.name}</span>
                      {c.archived && (
                        <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground">
                          Archived
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{c.email}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{c.company ?? '-'}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{c.servicesCount}</TableCell>
                  <TableCell className="text-xs font-semibold">
                    {formatCurrency(c.totalRevenue, state.business.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedCustomer(c)}
                        aria-label={`View details for ${c.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditCustomer(c)}
                        aria-label={`Edit ${c.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c)}
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {tp > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
              <span>
                Showing {(page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, filtered.length)} of{' '}
                {filtered.length} customers
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2">
                  Page {page} of {tp}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= tp}
                  onClick={() => setPage(page + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Customer Detail & Cross-Module Relationships Dialog */}
      {selectedCustomer && (
        <Dialog open onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> {selectedCustomer.name}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedCustomer.status} />
                  {selectedCustomer.archived && (
                    <Badge variant="outline" className="text-xs">
                      Archived
                    </Badge>
                  )}
                </div>
              </div>
              <DialogDescription>
                Customer ID: <span className="font-mono">{selectedCustomer.id}</span> &middot; Member since{' '}
                {formatDate(selectedCustomer.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-2 space-y-4">
              <TabsList className="grid grid-cols-6 text-xs h-9">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="services">Services ({customerServices.length})</TabsTrigger>
                <TabsTrigger value="orders">Orders ({customerOrders.length})</TabsTrigger>
                <TabsTrigger value="invoices">Invoices ({customerInvoices.length})</TabsTrigger>
                <TabsTrigger value="domains">Domains ({customerDomains.length})</TabsTrigger>
                <TabsTrigger value="tickets">Tickets ({customerTickets.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border p-3 bg-muted/20 text-xs">
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <div className="font-medium text-foreground truncate mt-0.5">{selectedCustomer.email}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Company:</span>
                    <div className="font-medium text-foreground mt-0.5">{selectedCustomer.company || 'Individual'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lifetime Revenue:</span>
                    <div className="font-bold text-foreground mt-0.5">
                      {formatCurrency(selectedCustomer.totalRevenue, state.business.currency)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Credit Balance:</span>
                    <div className="font-medium text-foreground mt-0.5">
                      {formatCurrency(selectedCustomer.creditBalance, state.business.currency)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Activity History
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-lg border p-3 bg-card text-xs">
                    {selectedCustomer.activity.map((act) => (
                      <div key={act.id} className="flex items-center justify-between border-b pb-1.5 last:border-0 last:pb-0">
                        <span className="text-foreground">{act.description}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {relativeTime(act.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="services" className="space-y-2">
                {customerServices.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4 text-center">No active or pending services.</p>
                ) : (
                  <div className="space-y-2">
                    {customerServices.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 text-xs">
                        <div>
                          <div className="font-semibold text-foreground">{s.productName}</div>
                          <div className="text-muted-foreground font-mono text-[11px]">{s.domain || 'No domain attached'}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={s.status} />
                          <span className="font-medium">{formatCurrency(s.price, state.business.currency)}</span>
                          <Button size="sm" variant="ghost" asChild className="h-7 text-xs">
                            <Link href="/demo/services">View &rarr;</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="orders" className="space-y-2">
                {customerOrders.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4 text-center">No orders on record.</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-lg border p-3 text-xs">
                        <div>
                          <span className="font-mono font-semibold text-foreground">{o.orderNumber}</span>
                          <span className="text-muted-foreground ml-2">{o.productName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={o.status} />
                          <span className="font-medium">{formatCurrency(o.amount, state.business.currency)}</span>
                          <Button size="sm" variant="ghost" asChild className="h-7 text-xs">
                            <Link href="/demo/orders">View &rarr;</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="invoices" className="space-y-2">
                {customerInvoices.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4 text-center">No invoices generated.</p>
                ) : (
                  <div className="space-y-2">
                    {customerInvoices.map((i) => (
                      <div key={i.id} className="flex items-center justify-between rounded-lg border p-3 text-xs">
                        <div>
                          <span className="font-mono font-semibold text-foreground">{i.invoiceNumber}</span>
                          <span className="text-muted-foreground ml-2">Due {formatDate(i.dueDate)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={i.status} />
                          <span className="font-medium">{formatCurrency(i.total, i.currency)}</span>
                          <Button size="sm" variant="ghost" asChild className="h-7 text-xs">
                            <Link href="/demo/invoices">View &rarr;</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="domains" className="space-y-2">
                {customerDomains.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4 text-center">No domains owned.</p>
                ) : (
                  <div className="space-y-2">
                    {customerDomains.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-lg border p-3 text-xs">
                        <span className="font-mono font-semibold">{d.domain}</span>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={d.status} />
                          <Button size="sm" variant="ghost" asChild className="h-7 text-xs">
                            <Link href="/demo/domains">View &rarr;</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tickets" className="space-y-2">
                {customerTickets.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4 text-center">No support tickets.</p>
                ) : (
                  <div className="space-y-2">
                    {customerTickets.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border p-3 text-xs">
                        <div>
                          <span className="font-mono font-semibold">{t.ticketNumber}</span>
                          <span className="text-foreground ml-2">{t.subject}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={t.status} />
                          <Button size="sm" variant="ghost" asChild className="h-7 text-xs">
                            <Link href="/demo/tickets">View &rarr;</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex-wrap gap-2 pt-2 border-t">
              {!selectedCustomer.archived && (
                <Button variant="outline" size="sm" onClick={() => handleArchive(selectedCustomer)}>
                  <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive Safely
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(selectedCustomer)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Customer
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Customer Dialog */}
      {editCustomer && (
        <CustomerFormDialog
          customer={editCustomer}
          onSave={handleSave}
          onClose={() => setEditCustomer(null)}
        />
      )}

      {/* Create Customer Dialog */}
      {createOpen && (
        <CustomerFormDialog
          onSave={(c) => handleCreate(c)}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </>
  );
}

function CustomerFormDialog({
  customer,
  onSave,
  onClose,
}: {
  customer?: Customer;
  onSave: (c: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(customer?.name ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [company, setCompany] = useState(customer?.company ?? '');
  const [country, setCountry] = useState(customer?.country ?? 'United States');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [status, setStatus] = useState(customer?.status ?? 'active');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Customer name is required.');
      return;
    }
    if (!workflows.isValidEmail(email)) {
      toast.error('A valid email address is required.');
      return;
    }

    if (customer) {
      onSave({
        ...customer,
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || null,
        country: country.trim(),
        phone: phone.trim() || null,
        status,
      });
    } else {
      onSave({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || null,
        country: country.trim(),
        phone: phone.trim() || null,
      });
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          <DialogDescription>
            {customer ? 'Update customer profile and account details' : 'Create a new customer account in the demo store'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="c-name">Full Name *</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-email">Email Address *</Label>
            <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="c-comp">Company</Label>
              <Input id="c-comp" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-country">Country</Label>
              <Input id="c-country" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-phone">Phone Number</Label>
            <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          {customer && (
            <div className="space-y-2">
              <Label>Account Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{customer ? 'Save Changes' : 'Create Customer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
