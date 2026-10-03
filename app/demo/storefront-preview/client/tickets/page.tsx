'use client';

import { useState } from 'react';
import {
  LifeBuoy,
  Plus,
  Send,
  MessageSquare,
  Clock,
  User,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { relativeTime } from '@/lib/demo/selectors';
import * as workflows from '@/lib/demo/workflows';
import type { Ticket, TicketPriority } from '@/lib/demo/types';
import { ClientPortalLayout } from '@/components/client-portal/client-portal-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function ClientTicketsPage() {
  const { state, setState } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const activeCustomerId = state.activeClientCustomerId || state.customers[0]?.id;
  const customer = state.customers.find((c) => c.id === activeCustomerId) || state.customers[0];

  const myTickets = state.tickets.filter((t) => t.customerId === customer?.id);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    myTickets[0]?.id || null
  );

  // New ticket modal state
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Support');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [message, setMessage] = useState('');

  // Reply message state
  const [replyText, setReplyText] = useState('');

  const currentTicket = state.tickets.find((t) => t.id === selectedTicketId);

  function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required.');
      return;
    }

    try {
      const result = workflows.clientOpenTicket(state, {
        customerId: customer.id,
        subject,
        category,
        priority,
        message,
      });

      setState(() => result.state);
      setSelectedTicketId(result.ticket.id);
      setNewTicketOpen(false);
      setSubject('');
      setMessage('');
      toast.success(`Ticket ${result.ticket.ticketNumber} opened successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to open ticket');
    }
  }

  function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || !selectedTicketId || !replyText.trim()) return;

    try {
      setState((prev) => workflows.clientReplyTicket(prev, selectedTicketId, customer.id, replyText));
      setReplyText('');
      toast.success('Reply submitted to support staff!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reply');
    }
  }

  return (
    <ClientPortalLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Support Tickets</h1>
            <p className="text-xs text-slate-500 mt-1">
              Direct technical helpdesk requests tracked and synchronized with our operations desk.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setNewTicketOpen(true)}
            className="text-xs text-white font-semibold"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Open New Ticket
          </Button>
        </div>

        {myTickets.length === 0 ? (
          <Card className="border border-dashed border-slate-300 p-12 text-center space-y-3">
            <LifeBuoy className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-base text-slate-900">No active support tickets</h3>
            <p className="text-xs text-slate-500">Need help with DNS, migrations, or server configuration?</p>
            <Button
              size="sm"
              onClick={() => setNewTicketOpen(true)}
              className="text-xs text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Open a Support Ticket
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Ticket List Column */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Your Tickets ({myTickets.length})
              </span>
              <div className="space-y-2">
                {myTickets.map((t) => {
                  const isSelected = t.id === selectedTicketId;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all text-xs space-y-1.5 ${
                        isSelected
                          ? 'border-blue-500 bg-white shadow-xs ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{t.ticketNumber}</span>
                        <Badge
                          variant={t.status === 'open' ? 'default' : 'secondary'}
                          className={`text-[10px] ${
                            t.status === 'open'
                              ? 'bg-blue-600'
                              : t.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="font-semibold text-slate-800 truncate">{t.subject}</div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>{t.category}</span>
                        <span>{relativeTime(t.updatedAt || t.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ticket Conversation Column */}
            <div className="lg:col-span-7">
              {currentTicket ? (
                <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold text-slate-900">
                            {currentTicket.ticketNumber}: {currentTicket.subject}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {currentTicket.priority} Priority
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Category: {currentTicket.category} • Assigned to: {currentTicket.assignedTo || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Messages Thread */}
                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                      {currentTicket.messages
                        .filter((m) => !m.internal)
                        .map((msg) => {
                          const isStaff = msg.authorType === 'staff';
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col rounded-xl p-4 text-xs space-y-1.5 ${
                                isStaff
                                  ? 'bg-blue-50/80 border border-blue-200 text-slate-800 ml-4'
                                  : 'bg-slate-100 border border-slate-200 text-slate-900 mr-4'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold flex items-center gap-1.5">
                                  {isStaff ? (
                                    <Shield className="h-3.5 w-3.5 text-blue-600" />
                                  ) : (
                                    <User className="h-3.5 w-3.5 text-slate-500" />
                                  )}
                                  {msg.author} {isStaff && <Badge className="text-[9px] h-4 bg-blue-600">Support Staff</Badge>}
                                </span>
                                <span className="text-slate-400">{relativeTime(msg.timestamp)}</span>
                              </div>
                              <p className="whitespace-pre-line leading-relaxed">{msg.message}</p>
                            </div>
                          );
                        })}
                    </div>

                    {/* Reply Input Form */}
                    <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 space-y-3">
                      <Label htmlFor="replyText" className="text-xs font-semibold text-slate-700">Post Reply</Label>
                      <Textarea
                        id="replyText"
                        placeholder="Type your message to support staff..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        className="text-xs"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!replyText.trim()}
                          className="text-xs text-white font-semibold"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Send className="mr-1.5 h-3.5 w-3.5" /> Send Reply
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-400">
                  Select a ticket on the left to view the conversation history.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Open Ticket Dialog */}
        <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
          <DialogContent className="max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">Open New Support Ticket</DialogTitle>
              <DialogDescription className="text-xs">
                Submit an inquiry directly to the {config.businessName} hosting team.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="ticketSubject">Subject</Label>
                <Input
                  id="ticketSubject"
                  placeholder="e.g. Need assistance with SSL certificate installation"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technical Support">Technical Support</SelectItem>
                      <SelectItem value="Billing & Invoicing">Billing & Invoicing</SelectItem>
                      <SelectItem value="Domain Registration">Domain Registration</SelectItem>
                      <SelectItem value="Server Configuration">Server Configuration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(val) => setPriority(val as TicketPriority)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ticketMsg">Detailed Message</Label>
                <Textarea
                  id="ticketMsg"
                  placeholder="Provide domain name, service IP, or error logs if applicable..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="text-xs"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs text-white w-full"
                  style={{ backgroundColor: primaryColor }}
                >
                  Create Support Ticket
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ClientPortalLayout>
  );
}
