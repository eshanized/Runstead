'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, LifeBuoy, Eye, Send, StickyNote, Plus, User } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardPageHeader, DashboardEmptyState } from '@/components/dashboard/dashboard-helpers';
import { useDemo } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import { searchTickets, filterTicketsByStatus, filterTicketsByPriority, formatDateTime, relativeTime } from '@/lib/demo/selectors';
import type { Ticket, TicketStatus, TicketPriority } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const priorityColors: Record<TicketPriority, 'default' | 'secondary' | 'destructive'> = {
  low: 'secondary',
  medium: 'secondary',
  high: 'default',
  urgent: 'destructive',
};

export default function TicketsPage() {
  return (
    <DashboardShell>
      <TicketsContent />
    </DashboardShell>
  );
}

function TicketsContent() {
  const { state, setState, syncFromServer } = useDemo();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  // New ticket state
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Support');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [initialMessage, setInitialMessage] = useState('');

  const selectedTicket = useMemo(() => {
    return state.tickets.find((t) => t.id === selectedTicketId) ?? null;
  }, [state.tickets, selectedTicketId]);

  const filtered = useMemo(() => {
    let result = searchTickets(state.tickets, search);
    result = filterTicketsByStatus(result, statusFilter);
    result = filterTicketsByPriority(result, priorityFilter);
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [state.tickets, search, statusFilter, priorityFilter]);

  async function sendReply() {
    if (!selectedTicket || !reply.trim()) return;
    try {
      const res = await fetch('/api/reseller/tickets?tenantId=default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: reply.trim(),
          isInternal,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to dispatch reply');

      await syncFromServer();
      setReply('');
      setIsInternal(false);
      toast.success(isInternal ? 'Internal note recorded in database' : 'Reply saved and dispatched to customer');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
    }
  }

  function changeStatus(newStatus: TicketStatus) {
    if (!selectedTicket) return;
    try {
      setState((prev) => workflows.updateTicketStatus(prev, { ticketId: selectedTicket.id, status: newStatus }));
      toast.success(`Ticket marked as ${newStatus.replace(/_/g, ' ')}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update ticket status');
    }
  }

  async function handleCreateTicket(ev: React.FormEvent) {
    ev.preventDefault();
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!initialMessage.trim()) {
      toast.error('Initial message is required');
      return;
    }

    try {
      const res = await fetch('/api/reseller/tickets?tenantId=default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          subject: subject.trim(),
          category,
          priority,
          message: initialMessage.trim(),
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to create ticket');

      await syncFromServer();
      setCreateTicketOpen(false);
      setCustomerId('');
      setSubject('');
      setInitialMessage('');
      toast.success('Support ticket created and saved to database.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create ticket');
    }
  }

  return (
    <>
      <DashboardPageHeader
        title="Support Tickets"
        description={`${state.tickets.length} tickets across customer accounts`}
        actions={
          <Button onClick={() => setCreateTicketOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Open New Ticket
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tickets by subject or customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <DashboardEmptyState icon={LifeBuoy} title="No tickets found" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium font-mono text-xs">{t.ticketNumber}</TableCell>
                  <TableCell className="max-w-xs truncate font-medium">{t.subject}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/customers?search=${encodeURIComponent(t.customerName)}`} className="hover:underline">
                      {t.customerName}
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant={priorityColors[t.priority]}>{t.priority}</Badge></TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{t.assignedTo ?? 'Unassigned'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{relativeTime(t.updatedAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedTicketId(t.id)} aria-label={`View ticket ${t.ticketNumber}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Ticket Details & Discussion Dialog */}
      {selectedTicket && (
        <Dialog open onOpenChange={(open) => { if (!open) setSelectedTicketId(null); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="text-lg">{selectedTicket.subject}</DialogTitle>
                <StatusBadge status={selectedTicket.status} />
              </div>
              <DialogDescription>
                Ticket <strong>{selectedTicket.ticketNumber}</strong> &bull; Customer: <Link href={`/dashboard/customers?search=${encodeURIComponent(selectedTicket.customerName)}`} className="text-accent underline font-medium">{selectedTicket.customerName}</Link> &bull; Category: {selectedTicket.category}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3 py-2 border-y my-2 text-xs">
              <div>
                <span className="text-muted-foreground">Priority: </span>
                <Badge variant={priorityColors[selectedTicket.priority]} className="capitalize">{selectedTicket.priority}</Badge>
              </div>
              <div className="text-muted-foreground">
                Assigned: <span className="font-medium text-foreground">{selectedTicket.assignedTo ?? 'Unassigned'}</span>
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
              {selectedTicket.messages.map((m) => (
                <div key={m.id} className={`rounded-lg border p-3 ${m.internal ? 'bg-amber-500/10 border-amber-500/30' : m.authorType === 'staff' ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold">{m.author}</span>
                    {m.authorType === 'staff' && <Badge variant="secondary" className="text-[10px] py-0">Staff Support</Badge>}
                    {m.internal && <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/40 text-amber-500 py-0"><StickyNote className="h-2.5 w-2.5" /> Internal Note</Badge>}
                    <span className="text-xs text-muted-foreground ml-auto">{formatDateTime(m.timestamp)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t pt-4">
              <Label className="text-xs font-semibold">Post Response or Staff Note</Label>
              <Textarea
                placeholder="Type your response to the customer or internal note..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
              />
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant={isInternal ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsInternal(!isInternal)}
                  className={isInternal ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
                >
                  <StickyNote className="mr-1.5 h-3.5 w-3.5" />
                  {isInternal ? 'Internal note mode ON' : 'Make internal note'}
                </Button>
                <Button onClick={sendReply} disabled={!reply.trim()}>
                  <Send className="mr-2 h-4 w-4" /> {isInternal ? 'Add Internal Note' : 'Send Reply'}
                </Button>
              </div>
            </div>

            <DialogFooter className="flex-wrap gap-2 sm:justify-between border-t pt-3">
              <div className="flex items-center gap-2">
                {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                  <>
                    {selectedTicket.status === 'open' && (
                      <Button variant="outline" size="sm" onClick={() => changeStatus('in_progress')}>
                        Mark In Progress
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => changeStatus('resolved')}>
                      Resolve Ticket
                    </Button>
                  </>
                )}
                {selectedTicket.status === 'resolved' && (
                  <Button variant="outline" size="sm" onClick={() => changeStatus('closed')}>
                    Close Ticket
                  </Button>
                )}
                {selectedTicket.status === 'closed' && (
                  <Button variant="outline" size="sm" onClick={() => changeStatus('open')}>
                    Reopen Ticket
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedTicketId(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create New Ticket Modal */}
      {createTicketOpen && (
        <Dialog open onOpenChange={setCreateTicketOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Open New Support Ticket</DialogTitle>
              <DialogDescription>Open a support ticket on behalf of an existing customer</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="customerSelect">Customer *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger id="customerSelect"><SelectValue placeholder="Choose customer" /></SelectTrigger>
                  <SelectContent>
                    {state.customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketSubject">Subject *</Label>
                <Input
                  id="ticketSubject"
                  placeholder="e.g. PHP 8.3 Extension issue on cPanel"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technical Support">Technical</SelectItem>
                      <SelectItem value="Billing & Invoicing">Billing</SelectItem>
                      <SelectItem value="Domain Management">Domains</SelectItem>
                      <SelectItem value="General Inquiries">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketMessage">Initial Customer Message *</Label>
                <Textarea
                  id="ticketMessage"
                  placeholder="Describe the issue or request in detail..."
                  rows={4}
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateTicketOpen(false)}>Cancel</Button>
                <Button type="submit">Create Ticket</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
