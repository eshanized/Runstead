'use client';

import { useState, useEffect } from 'react';
import { Settings, UserPlus, Trash2, Shield } from 'lucide-react';
import { DemoShell } from '@/components/demo/demo-shell';
import { DemoPageHeader } from '@/components/demo/demo-helpers';
import { useDemo, generateId } from '@/lib/demo/store';
import type { BusinessSettings } from '@/lib/demo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function SettingsPage() {
  return (
    <DemoShell>
      <SettingsContent />
    </DemoShell>
  );
}

function SettingsContent() {
  const { state, setState } = useDemo();
  const [settings, setSettings] = useState<BusinessSettings>(state.business);
  const [hasChanges, setHasChanges] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Support Agent');

  useEffect(() => {
    if (!hasChanges) {
      setSettings(state.business);
    }
  }, [state.business, hasChanges]);

  function updateSetting<K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }

  function updateNotificationPref(key: keyof BusinessSettings['notificationPrefs'], value: boolean) {
    setSettings((prev) => ({ ...prev, notificationPrefs: { ...prev.notificationPrefs, [key]: value } }));
    setHasChanges(true);
  }

  function saveSettings() {
    setState((prev) => ({
      ...prev,
      business: settings,
      notifications: [
        {
          id: generateId('notif'),
          title: 'Business Settings Updated',
          description: `Preferences, currency (${settings.currency}), and tax configuration updated.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'info',
        },
        ...prev.notifications,
      ],
    }));
    setHasChanges(false);
    toast.success('Settings saved');
  }

  function addMember() {
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    const member = { id: generateId('tm'), name: newMemberName.trim(), email: newMemberEmail.trim(), role: newMemberRole, status: 'invited' as const };
    setSettings((prev) => ({ ...prev, teamMembers: [...prev.teamMembers, member] }));
    setHasChanges(true);
    setNewMemberName(''); setNewMemberEmail(''); setNewMemberRole('Support Agent');
    setAddMemberOpen(false);
    toast.success(`Team member ${member.name} invited`);
  }

  function removeMember(id: string) {
    setSettings((prev) => ({ ...prev, teamMembers: prev.teamMembers.filter((m) => m.id !== id) }));
    setHasChanges(true);
    toast.success('Team member removed');
  }

  const roles = ['Admin', 'Billing Manager', 'Support Agent', 'Read Only'];

  return (
    <>
      <DemoPageHeader
        title="Settings"
        description="Business profile, branding, team, and notification preferences"
        actions={hasChanges && <Button onClick={saveSettings}>Save Changes</Button>}
      />

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="billing">Billing & Tax</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="plan">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Business Profile</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="bizName">Business Name</Label><Input id="bizName" value={settings.businessName} onChange={(e) => updateSetting('businessName', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="legalName">Legal Name</Label><Input id="legalName" value={settings.legalName} onChange={(e) => updateSetting('legalName', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" value={settings.email} onChange={(e) => updateSetting('email', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" value={settings.phone} onChange={(e) => updateSetting('phone', e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="address">Address</Label><Input id="address" value={settings.address} onChange={(e) => updateSetting('address', e.target.value)} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label>Timezone</Label><Select value={settings.timezone} onValueChange={(v) => updateSetting('timezone', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem><SelectItem value="America/New_York">Eastern (ET)</SelectItem><SelectItem value="Europe/London">London (GMT)</SelectItem><SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem><SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem><SelectItem value="Asia/Kolkata">India (IST)</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Currency</Label><Select value={settings.currency} onValueChange={(v) => updateSetting('currency', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem><SelectItem value="INR">INR</SelectItem><SelectItem value="SGD">SGD</SelectItem></SelectContent></Select></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Tax Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="taxRate">Tax Rate (%)</Label><Input id="taxRate" type="number" step="0.01" value={settings.taxRate} onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value) || 0)} /></div>
                <div className="space-y-2"><Label htmlFor="taxId">Tax ID</Label><Input id="taxId" value={settings.taxId} onChange={(e) => updateSetting('taxId', e.target.value)} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Tax rate is applied to invoice line items. Consult a tax professional for proper tax configuration.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(Object.keys(settings.notificationPrefs) as (keyof BusinessSettings['notificationPrefs'])[]).map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="capitalize text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</Label>
                  <Switch checked={settings.notificationPrefs[key]} onCheckedChange={(v) => updateNotificationPref(key, v)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm">Team Members</CardTitle>
              <Button size="sm" onClick={() => setAddMemberOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Invite</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {settings.teamMembers.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-muted-foreground">{m.email}</TableCell>
                      <TableCell><Badge variant="secondary">{m.role}</Badge></TableCell>
                      <TableCell><Badge variant={m.status === 'active' ? 'default' : 'outline'}>{m.status}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => removeMember(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Current Plan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div><div className="text-2xl font-bold">{settings.currentPlan}</div><div className="text-sm text-muted-foreground">Current subscription plan (demo)</div></div>
                <Badge variant="secondary"><Shield className="mr-1 h-3 w-3" /> Active</Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Change Plan</Label>
                <Select value={settings.currentPlan} onValueChange={(v) => { updateSetting('currentPlan', v); setHasChanges(true); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Sandbox', 'Launch', 'Growth', 'Scale', 'Enterprise'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">Plan changes in the demo only affect local state. No real billing occurs.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {addMemberOpen && (
        <Dialog open onOpenChange={setAddMemberOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite Team Member</DialogTitle><DialogDescription>Send a demo invitation to a new team member</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label htmlFor="memberName">Name</Label><Input id="memberName" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="memberEmail">Email</Label><Input id="memberEmail" type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label>Role</Label><Select value={newMemberRole} onValueChange={setNewMemberRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
              <Button onClick={addMember}>Send Invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
