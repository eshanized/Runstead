'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Globe,
  Eye,
  Plus,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Network,
  Trash2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { DemoShell } from '@/components/demo/demo-shell';
import { DemoPageHeader, DemoEmptyState } from '@/components/demo/demo-helpers';
import { useDemo } from '@/lib/demo/store';
import * as workflows from '@/lib/demo/workflows';
import { searchDomains, checkDomainAvailability, formatDate, formatCurrency } from '@/lib/demo/selectors';
import type { Domain } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function DomainsPage() {
  return (
    <DemoShell>
      <DomainsContent />
    </DemoShell>
  );
}

function DomainsContent() {
  const { state, setState } = useDemo();
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  // Simulated Domain Purchase State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ available: boolean; price: number; tld: string } | null>(null);
  const [purchaseCustomerId, setPurchaseCustomerId] = useState(state.customers[0]?.id || '');
  const [simulatePaymentImmediately, setSimulatePaymentImmediately] = useState(true);

  // Connect Existing Domain Modal State
  const [connectOpen, setConnectOpen] = useState(false);
  const [existingDomainInput, setExistingDomainInput] = useState('');
  const [connectCustomerId, setConnectCustomerId] = useState(state.customers[0]?.id || '');

  const filtered = useMemo(() => {
    return searchDomains(state.domains, search).sort(
      (a, b) => new Date(b.registeredDate).getTime() - new Date(a.registeredDate).getTime()
    );
  }, [state.domains, search]);

  function handleDomainSearch() {
    if (!searchQuery.trim()) return;
    const check = workflows.isValidDomain(searchQuery.trim());
    if (!check.valid) {
      toast.error(check.error);
      return;
    }
    const result = checkDomainAvailability(searchQuery.trim().toLowerCase());
    setSearchResult(result);
  }

  function handleRegisterDomain() {
    if (!searchQuery.trim() || !searchResult?.available) return;
    if (!purchaseCustomerId) {
      toast.error('Please select a customer for the domain registration.');
      return;
    }

    try {
      const res = workflows.purchaseDomainSimulation(state, {
        customerId: purchaseCustomerId,
        domain: searchQuery.trim(),
        price: searchResult.price,
        autoRenew: true,
        simulatePayment: simulatePaymentImmediately,
      });

      setState(() => res.state);
      toast.success(
        `Domain ${res.domain.domain} purchased and registered! Order ${res.invoice.invoiceNumber} created.`
      );
      setSearchQuery('');
      setSearchResult(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to register domain');
    }
  }

  function handleConnectExisting() {
    if (!existingDomainInput.trim()) {
      toast.error('Domain name is required.');
      return;
    }
    if (!connectCustomerId) {
      toast.error('Customer owner is required.');
      return;
    }

    try {
      const nextState = workflows.connectExternalDomain(state, {
        customerId: connectCustomerId,
        domain: existingDomainInput.trim(),
      });
      setState(() => nextState);
      toast.success(`External domain ${existingDomainInput.trim()} connected and DNS zone created!`);
      setExistingDomainInput('');
      setConnectOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect domain');
    }
  }

  function toggleAutoRenew(domain: Domain) {
    try {
      const updated: Domain = { ...domain, autoRenew: !domain.autoRenew };
      setState((prev) => ({
        ...prev,
        domains: prev.domains.map((d) => (d.id === domain.id ? updated : d)),
      }));
      setSelectedDomain(updated);
      toast.success(`Auto-renew ${updated.autoRenew ? 'enabled' : 'disabled'} for ${domain.domain}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function handleRenewDomain(domain: Domain) {
    try {
      const nextState = workflows.renewDomain(state, { domainId: domain.id, years: 1 });
      setState(() => nextState);
      const updated = nextState.domains.find((d) => d.id === domain.id)!;
      setSelectedDomain(updated);
      toast.success(`Domain ${domain.domain} renewed for 1 additional year.`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function handleDeleteDomain(domain: Domain) {
    if (!confirm(`Are you sure you want to remove domain ${domain.domain}? Associated DNS zone will also be deleted.`)) return;
    try {
      const nextState = workflows.deleteDomain(state, domain.id);
      setState(() => nextState);
      setSelectedDomain(null);
      toast.success(`Domain ${domain.domain} deleted.`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <DemoPageHeader
        title="Domains"
        description={`${state.domains.length} domains in demo inventory`}
        actions={
          <Button onClick={() => setConnectOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Connect External Domain
          </Button>
        }
      />

      {/* Domain search & simulation card */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Simulated Domain Registration Engine</h3>
              <p className="text-xs text-muted-foreground">
                Search domain availability, simulate registrar checkout, order &amp; invoice generation, and DNS zone setup.
              </p>
            </div>
            <Badge variant="outline" className="border-accent text-accent text-[11px]">
              ResellerClub Driver (Simulated)
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="example.com"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchResult(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleDomainSearch()}
              className="flex-1"
            />
            <Button onClick={handleDomainSearch}>
              <Search className="mr-2 h-4 w-4" /> Check Availability
            </Button>
          </div>

          {searchResult && (
            <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {searchResult.available ? (
                    <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-destructive shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold text-sm">{searchQuery.toLowerCase()}</div>
                    <div className="text-xs text-muted-foreground">
                      {searchResult.available
                        ? `Available via simulated registrar — ${formatCurrency(searchResult.price, state.business.currency)}/yr`
                        : 'Currently registered or unavailable'}
                    </div>
                  </div>
                </div>

                {searchResult.available && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Select value={purchaseCustomerId} onValueChange={setPurchaseCustomerId}>
                      <SelectTrigger className="w-[180px] h-9 text-xs">
                        <SelectValue placeholder="Select Owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button onClick={handleRegisterDomain} size="sm">
                      Register (Simulated)
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                All pricing and availability results are deterministic simulations for platform evaluation. No live registrar requests are dispatched.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Domain search input filter */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter domains by name, customer, registrar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <DemoEmptyState icon={Globe} title="No domains found" description="Register a new domain or connect an external one above." />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Owner / Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Registrar</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Auto-Renew</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium font-mono text-xs">
                    {d.domain}
                  </TableCell>
                  <TableCell>{d.customerName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px] capitalize">
                      {d.domainType || (d.registrar.includes('External') ? 'External' : 'Registered')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.registrar}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(d.expiryDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.autoRenew ? 'secondary' : 'outline'} className="text-[10px]">
                      {d.autoRenew ? 'On' : 'Off'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDomain(d)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Connect External Domain Dialog */}
      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" /> Connect External Domain
            </DialogTitle>
            <DialogDescription>
              Connect an existing domain that your client registered elsewhere without transferring registrar ownership.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ext-domain">Domain Name *</Label>
              <Input
                id="ext-domain"
                placeholder="e.g. clientportal.org"
                value={existingDomainInput}
                onChange={(e) => setExistingDomainInput(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Domain Owner / Customer *</Label>
              <Select value={connectCustomerId} onValueChange={setConnectCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {state.customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground">Authoritative DNS Note:</span>
              <p>
                Connecting this domain creates an isolated DNS zone in Runstead with default nameserver pointers.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectExisting}>Connect Domain</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Domain Detail Dialog */}
      {selectedDomain && (
        <Dialog open onOpenChange={() => setSelectedDomain(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-mono flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> {selectedDomain.domain}
              </DialogTitle>
              <DialogDescription>
                Owned by {selectedDomain.customerName} &middot; {selectedDomain.registrar}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-muted/20">
                <div>
                  <span className="text-muted-foreground">Registration Type:</span>
                  <div className="font-medium capitalize mt-0.5">
                    {selectedDomain.domainType || (selectedDomain.registrar.includes('External') ? 'External' : 'Registered')}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="mt-0.5">
                    <StatusBadge status={selectedDomain.status} />
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Registered Date:</span>
                  <div className="font-medium mt-0.5">{formatDate(selectedDomain.registeredDate)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Expiration Date:</span>
                  <div className="font-medium mt-0.5">{formatDate(selectedDomain.expiryDate)}</div>
                </div>
              </div>

              {/* Linked DNS Zone */}
              <div className="rounded-lg border p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Network className="h-4 w-4 text-primary" /> Linked DNS Zone
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    {selectedDomain.dnsZoneId ? 'Zone configured and authoritative' : 'No DNS zone linked'}
                  </div>
                </div>
                {selectedDomain.dnsZoneId && (
                  <Button size="sm" variant="outline" asChild className="h-8 text-xs">
                    <Link href={`/demo/dns?zoneId=${selectedDomain.dnsZoneId}`}>
                      Open DNS Zone <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <div>
                  <span className="font-medium text-foreground">Auto-Renewal</span>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically generate renewal invoice 30 days prior to expiry
                  </p>
                </div>
                <Switch
                  checked={selectedDomain.autoRenew}
                  onCheckedChange={() => toggleAutoRenew(selectedDomain)}
                />
              </div>
            </div>

            <DialogFooter className="flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRenewDomain(selectedDomain)}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Renew 1 Year (Simulated)
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteDomain(selectedDomain)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Domain
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDomain(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
