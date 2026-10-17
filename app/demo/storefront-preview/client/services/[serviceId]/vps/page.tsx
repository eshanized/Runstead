'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDemo } from '@/lib/demo/store';
import {
  setServiceVpsPowerState,
  addServiceVpsSshKey,
  deleteServiceVpsSshKey,
  addServiceVpsFirewallRule,
  deleteServiceVpsFirewallRule,
} from '@/lib/demo/workflows';
import { createDefaultVpsData } from '@/lib/demo/service-factories';
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
  Server,
  Play,
  Square,
  RotateCcw,
  Terminal,
  Shield,
  Key,
  Plus,
  Trash2,
  Cpu,
  Layers,
  Copy,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceVpsPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state, setState } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);
  const vps = service?.vpsData || (service ? createDefaultVpsData(service.domain || 'vps.local', service.ipAddress || '198.51.100.80') : null);

  // SSH Key Dialog state
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyContent, setNewKeyContent] = useState('');

  // Firewall Rule Dialog state
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [newRulePort, setNewRulePort] = useState('8080');
  const [newRuleProto, setNewRuleProto] = useState<'TCP' | 'UDP' | 'TCP/UDP'>('TCP');
  const [newRuleSource, setNewRuleSource] = useState('0.0.0.0/0');
  const [newRuleAction, setNewRuleAction] = useState<'ALLOW' | 'DENY'>('ALLOW');
  const [newRuleDesc, setNewRuleDesc] = useState('Custom API Port');

  // Interactive Web Console State
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; out: string }>>([
    {
      cmd: 'uname -a',
      out: 'Linux runstead-vps-node4 6.8.0-31-generic #31-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux',
    },
    {
      cmd: 'uptime',
      out: '19:00:12 up 48 days, 14:22, 1 user, load average: 0.12, 0.08, 0.05',
    },
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  if (!service || !vps) {
    return <div className="p-8 text-center text-slate-500">Service not found.</div>;
  }

  function handlePowerAction(stateTarget: 'running' | 'stopped' | 'restarting') {
    try {
      const nextState = setServiceVpsPowerState(state, service!.id, stateTarget);
      setState(nextState);
      toast.success(`Server state changed to: ${stateTarget.toUpperCase()}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Power operation failed');
    }
  }

  function handleAddSshKey() {
    if (!newKeyName.trim() || !newKeyContent.trim()) {
      toast.error('Please enter key name and public key content.');
      return;
    }
    try {
      const nextState = addServiceVpsSshKey(state, service!.id, newKeyName.trim(), newKeyContent.trim());
      setState(nextState);
      toast.success('SSH Public Key authorized.');
      setAddKeyOpen(false);
      setNewKeyName('');
      setNewKeyContent('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid SSH key format');
    }
  }

  function handleDeleteSshKey(keyId: string) {
    try {
      const nextState = deleteServiceVpsSshKey(state, service!.id, keyId);
      setState(nextState);
      toast.success('SSH Key removed.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove SSH key');
    }
  }

  function handleAddFirewallRule() {
    try {
      const nextState = addServiceVpsFirewallRule(state, service!.id, {
        portRange: newRulePort.trim(),
        protocol: newRuleProto,
        source: newRuleSource.trim() || '0.0.0.0/0',
        action: newRuleAction,
        description: newRuleDesc.trim(),
      });
      setState(nextState);
      toast.success(`Firewall rule ${newRuleAction} ${newRulePort} added.`);
      setAddRuleOpen(false);
      setNewRulePort('8080');
      setNewRuleDesc('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error adding firewall rule');
    }
  }

  function handleDeleteFirewallRule(ruleId: string) {
    try {
      const nextState = deleteServiceVpsFirewallRule(state, service!.id, ruleId);
      setState(nextState);
      toast.success('Firewall rule deleted.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete rule');
    }
  }

  function handleSendTerminalCmd(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    let out = '';

    if (cmd === 'clear') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    } else if (cmd === 'help') {
      out = 'Available commands: uname -a, uptime, df -h, free -m, top, systemctl status nginx, docker ps, clear';
    } else if (cmd.includes('uname')) {
      out = 'Linux runstead-vps-node4 6.8.0-31-generic #31-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux';
    } else if (cmd.includes('uptime')) {
      out = '19:05:00 up 48 days, 14:27, 1 user, load average: 0.15, 0.10, 0.08';
    } else if (cmd.includes('df')) {
      out = 'Filesystem     1K-blocks     Used Available Use% Mounted on\n/dev/vda1       82543888 28410940  54116564  35% /\ntmpfs            4031648        0   4031648   0% /dev/shm';
    } else if (cmd.includes('free')) {
      out = '               total        used        free      shared  buff/cache   available\nMem:            8192        2410        4102          48        1680        5734\nSwap:           2048           0        2048';
    } else if (cmd.includes('top')) {
      out = 'PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n 841 root      20   0  184200  42100  12400 S   1.8   0.5   4:21.04 dockerd\n1204 www-data  20   0  145000  28900   9800 S   0.7   0.4   1:12.80 nginx';
    } else if (cmd.includes('nginx')) {
      out = '● nginx.service - A high performance web server and a reverse proxy server\n   Loaded: loaded (/lib/systemd/system/nginx.service; enabled)\n   Active: active (running) since Sun 2026-10-01 04:00:10 UTC; 16 days ago';
    } else if (cmd.includes('docker')) {
      out = 'CONTAINER ID   IMAGE          COMMAND                  CREATED        STATUS        PORTS     NAMES\na14b9c8d20e1   caddy:alpine   "caddy run --config…"   3 days ago     Up 3 days     80, 443   edge-proxy';
    } else {
      out = `bash: ${cmd}: command executed in simulated root context (exit code 0)`;
    }

    setTerminalHistory((prev) => [...prev, { cmd, out }]);
    setTerminalInput('');
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  }

  return (
    <div className="space-y-8">
      {/* Power Control & VM Spec Card */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Server className="h-5 w-5 text-indigo-600" />
                  VPS Hypervisor & Compute Node
                </CardTitle>
                <Badge
                  variant={vps.powerState === 'running' ? 'default' : 'secondary'}
                  className={vps.powerState === 'running' ? 'bg-emerald-600' : 'bg-slate-500'}
                >
                  {vps.powerState.toUpperCase()}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                KVM virtualization container running on enterprise AMD EPYC node cluster.
              </CardDescription>
            </div>

            {/* Power Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={vps.powerState === 'running' ? 'outline' : 'default'}
                disabled={vps.powerState === 'running'}
                className="text-xs gap-1.5"
                onClick={() => handlePowerAction('running')}
              >
                <Play className="h-3.5 w-3.5 text-emerald-600" />
                Power On
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1.5"
                onClick={() => handlePowerAction('restarting')}
              >
                <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                Reboot
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={vps.powerState === 'stopped'}
                className="text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={() => handlePowerAction('stopped')}
              >
                <Square className="h-3.5 w-3.5" />
                Power Off
              </Button>

              <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1.5 ml-2"
                onClick={() => setConsoleOpen(true)}
              >
                <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                Web Console
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 text-xs">
          {/* Spec Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 font-mono">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OS Image</span>
              <span className="text-slate-900 font-bold text-xs mt-0.5 block truncate">{vps.os}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">vCPU Cores</span>
              <span className="text-slate-900 font-bold text-xs mt-0.5 block">{vps.cpuCores} vCPU Cores</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Memory (RAM)</span>
              <span className="text-slate-900 font-bold text-xs mt-0.5 block">{vps.memoryGB} GB DDR5</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NVMe Storage</span>
              <span className="text-slate-900 font-bold text-xs mt-0.5 block">{vps.storageGB} GB NVMe</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Public IPv4</span>
              <span className="text-slate-900 font-bold text-xs mt-0.5 block">{service.ipAddress || '198.51.100.80'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SSH Keys & Cloud Firewall */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SSH Public Keys */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Key className="h-4 w-4 text-amber-600" />
                  Authorized SSH Public Keys
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Passwordless root login via public key cryptography.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setAddKeyOpen(true)}>
                <Plus className="h-3.5 w-3.5 text-amber-600" />
                Add Key
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-sans font-semibold text-slate-600">
                    <th className="py-2.5 px-3">Key Label</th>
                    <th className="py-2.5 px-3">Fingerprint</th>
                    <th className="py-2.5 px-3 text-right font-sans">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vps.sshKeys.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400 font-sans">
                        No authorized SSH keys registered.
                      </td>
                    </tr>
                  ) : (
                    vps.sshKeys.map((k) => (
                      <tr key={k.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-slate-900">{k.name}</td>
                        <td className="py-3 px-3 text-slate-500 truncate max-w-[140px]">
                          {k.publicKey.slice(0, 24)}...
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-600 hover:text-rose-600"
                            onClick={() => handleDeleteSshKey(k.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Cloud Firewall Rules */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Edge Cloud Firewall
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Hardware-enforced packet filtering before reaching the hypervisor.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setAddRuleOpen(true)}>
                <Plus className="h-3.5 w-3.5 text-blue-600" />
                Add Rule
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-sans font-semibold text-slate-600">
                    <th className="py-2.5 px-3">Port / Protocol</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3 text-right font-sans">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vps.firewallRules.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {r.portRange} ({r.protocol})
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant="outline"
                          className={`font-mono text-[10px] ${
                            r.action === 'ALLOW'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {r.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{r.source}</td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-slate-600 hover:text-rose-600"
                          onClick={() => handleDeleteFirewallRule(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Web Console Modal */}
      <Dialog open={consoleOpen} onOpenChange={setConsoleOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 bg-slate-950 text-emerald-400 border-slate-800">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-mono text-emerald-300 flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                root@{service.domain}: ~ (Simulated Out-of-Band Console)
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 my-3 overflow-y-auto space-y-2 font-mono text-xs max-h-[50vh] p-3 rounded-lg bg-black/50 border border-slate-800">
            <div className="text-slate-500">
              Connected to QEMU/KVM serial ttyS0 console on {vps.os}. Type &quot;help&quot; for sample commands.
            </div>

            {terminalHistory.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2 text-slate-200 font-bold">
                  <span className="text-indigo-400">root@vps:#</span>
                  <span>{item.cmd}</span>
                </div>
                <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">{item.out}</pre>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendTerminalCmd} className="flex gap-2">
            <span className="text-indigo-400 font-mono text-xs self-center">root@vps:#</span>
            <Input
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="Enter command (e.g. uname -a, top, uptime)..."
              className="flex-1 bg-slate-900 border-slate-700 text-emerald-300 font-mono text-xs h-9 focus-visible:ring-emerald-500"
              autoFocus
            />
            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold">
              <Send className="h-3.5 w-3.5 mr-1" />
              Exec
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add SSH Key Dialog */}
      <Dialog open={addKeyOpen} onOpenChange={setAddKeyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add SSH Public Key</DialogTitle>
            <DialogDescription className="text-xs">
              Paste the public key from your workstation (`~/.ssh/id_rsa.pub` or `~/.ssh/id_ed25519.pub`).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Key Name</label>
              <Input
                placeholder="e.g. MacBook Pro, Workstation 2026"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Public Key (ssh-rsa / ssh-ed25519)</label>
              <textarea
                rows={4}
                placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... user@workstation"
                value={newKeyContent}
                onChange={(e) => setNewKeyContent(e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-md border border-slate-300 focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setAddKeyOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddSshKey} className="bg-amber-600 hover:bg-amber-700 text-white">
              Authorize Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Firewall Rule Dialog */}
      <Dialog open={addRuleOpen} onOpenChange={setAddRuleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Cloud Firewall Rule</DialogTitle>
            <DialogDescription className="text-xs">
              Specify inbound packet filtering rules for this virtual machine.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Port / Range</label>
                <Input
                  placeholder="e.g. 8080 or 3000-3050"
                  value={newRulePort}
                  onChange={(e) => setNewRulePort(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Protocol</label>
                <select
                  value={newRuleProto}
                  onChange={(e) => setNewRuleProto(e.target.value as 'TCP' | 'UDP' | 'TCP/UDP')}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-mono"
                >
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="TCP/UDP">TCP/UDP</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Source CIDR</label>
                <Input
                  placeholder="0.0.0.0/0"
                  value={newRuleSource}
                  onChange={(e) => setNewRuleSource(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Action</label>
                <select
                  value={newRuleAction}
                  onChange={(e) => setNewRuleAction(e.target.value as 'ALLOW' | 'DENY')}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-mono"
                >
                  <option value="ALLOW">ALLOW</option>
                  <option value="DENY">DENY</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <Input
                placeholder="e.g. Custom Node.js API"
                value={newRuleDesc}
                onChange={(e) => setNewRuleDesc(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setAddRuleOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddFirewallRule} className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
