'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserCheck, ShieldCheck, ArrowRight, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ClientLoginPage() {
  const router = useRouter();
  const { state, setState } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const [customEmail, setCustomEmail] = useState('');

  function handleSelectCustomer(customerId: string) {
    setState((prev) => ({
      ...prev,
      activeClientCustomerId: customerId,
    }));
    const customer = state.customers.find((c) => c.id === customerId);
    toast.success(`Signed in as ${customer?.name || 'Customer'}`);
    router.push('/demo/storefront-preview/client/dashboard');
  }

  function handleCustomLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!customEmail.trim()) {
      toast.error('Please enter an email address.');
      return;
    }

    const matched = state.customers.find(
      (c) => c.email.toLowerCase() === customEmail.trim().toLowerCase()
    );

    if (matched) {
      handleSelectCustomer(matched.id);
    } else {
      toast.error(`No customer found with email "${customEmail}". Please select one of the seeded accounts below.`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Top Bar */}
      <div className="border-b bg-white py-3 px-4 sm:px-8 flex items-center justify-between">
        <Link href="/demo/storefront-preview" className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {config.businessName} Storefront
        </Link>
        <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50 text-[11px]">
          Simulated Customer Login
        </Badge>
      </div>

      <div className="mx-auto max-w-md w-full px-4 py-12 space-y-6">
        <div className="text-center space-y-2">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md font-bold text-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {config.logoText || config.businessName.slice(0, 2).toUpperCase()}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {config.businessName} Client Portal
          </h1>
          <p className="text-xs text-slate-500">
            Select a seeded demo customer account to test client isolation and service management.
          </p>
        </div>

        {/* Demo Notice */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Demo Sandbox Authentication
          </div>
          <p className="text-[11px] leading-relaxed">
            No real passwords required. Selecting an account loads only their associated services, domains, invoices, and support tickets from shared demo state.
          </p>
        </div>

        {/* 1-Click Demo Customer Selection */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              One-Click Seeded Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {state.customers.slice(0, 4).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectCustomer(c.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left text-xs group"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-slate-500">{c.email}</div>
                  <div className="text-[10px] text-slate-400">
                    {c.servicesCount} active {c.servicesCount === 1 ? 'service' : 'services'} • {c.company || 'Personal'}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-blue-600">
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </CardContent>

          <CardFooter className="pt-2 border-t border-slate-100 flex flex-col gap-3">
            <form onSubmit={handleCustomLogin} className="w-full space-y-2">
              <span className="text-[11px] font-semibold text-slate-500">Or sign in with any customer email:</span>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="e.g. sarah.mitchell@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="text-xs h-9"
                />
                <Button type="submit" size="sm" className="text-xs text-white" style={{ backgroundColor: primaryColor }}>
                  Sign In
                </Button>
              </div>
            </form>
          </CardFooter>
        </Card>
      </div>

      <div className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        {config.businessName} • White-Label Customer Portal Demonstration
      </div>
    </div>
  );
}
