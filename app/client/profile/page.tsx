'use client';

import { useState } from 'react';
import { User, Mail, Phone, Building2, Save, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/demo/selectors';
import * as workflows from '@/lib/demo/workflows';
import { ClientPortalLayout } from '@/components/client-portal/client-portal-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function ClientProfilePage() {
  const { state, setState } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const activeCustomerId = state.activeClientCustomerId || state.customers[0]?.id;
  const customer = state.customers.find((c) => c.id === activeCustomerId) || state.customers[0];

  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [company, setCompany] = useState(customer?.company || '');

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    if (!name.trim()) {
      toast.error('Customer name is required.');
      return;
    }

    try {
      setState((prev) =>
        workflows.clientUpdateProfile(prev, customer.id, {
          name,
          phone,
          company,
        })
      );
      toast.success('Account profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    }
  }

  return (
    <ClientPortalLayout>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="border-b border-slate-200 pb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Profile</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal contact details, organizational affiliation, and billing credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-start">
          {/* Summary Column */}
          <div className="md:col-span-4 space-y-4">
            <Card className="border border-slate-200 bg-white p-6 shadow-xs text-center space-y-3">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white font-extrabold text-xl shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {customer?.name.slice(0, 2).toUpperCase() || 'CU'}
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">{customer?.name}</h3>
                <p className="text-xs text-slate-500">{customer?.email}</p>
                <Badge variant="outline" className="mt-2 text-[10px] border-emerald-300 bg-emerald-50 text-emerald-800">
                  {customer?.status.toUpperCase()} ACCOUNT
                </Badge>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer ID:</span>
                  <span className="font-mono font-semibold">{customer?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Credit:</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(customer?.creditBalance || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Member Since:</span>
                  <span>{customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-8">
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900">Contact Information</CardTitle>
                <CardDescription className="text-xs">
                  Updates made here immediately synchronize with reseller customer management records.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSave}>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="profName">Full Name</Label>
                    <Input
                      id="profName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-xs h-10"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profEmail">Email Address (Read-only)</Label>
                    <Input
                      id="profEmail"
                      value={customer?.email || ''}
                      disabled
                      className="text-xs h-10 bg-slate-50 text-slate-500"
                    />
                    <p className="text-[10px] text-slate-400">Email is tied to primary billing identity.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="profCompany">Company / Organization</Label>
                      <Input
                        id="profCompany"
                        placeholder="Company name"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="profPhone">Telephone Number</Label>
                      <Input
                        id="profPhone"
                        placeholder="+1 555 0199"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t border-slate-100 flex justify-end">
                  <Button
                    type="submit"
                    className="text-xs text-white font-semibold h-9 px-5 gap-1.5"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Save className="h-3.5 w-3.5" /> Save Profile Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </ClientPortalLayout>
  );
}
