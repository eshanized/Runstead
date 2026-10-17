'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ClientLoginPage() {
  const router = useRouter();
  const { state, setState } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Check for matching customer in state
        const matched = state.customers.find(
          (c) => c.email.toLowerCase() === email.trim().toLowerCase()
        );
        if (matched) {
          setState((prev) => ({
            ...prev,
            activeClientCustomerId: matched.id,
          }));
          toast.success(`Signed in as ${matched.name}`);
          router.push('/demo/storefront-preview/client/dashboard');
          return;
        }
        throw new Error(data.error || 'Invalid credentials');
      }

      // Live authentication succeeded
      const customer = state.customers.find(
        (c) => c.email.toLowerCase() === email.trim().toLowerCase()
      ) || state.customers[0];

      if (customer) {
        setState((prev) => ({
          ...prev,
          activeClientCustomerId: customer.id,
        }));
      }

      toast.success(`Welcome back, ${data.user?.name || 'Customer'}!`);
      router.push('/demo/storefront-preview/client/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFillAccount(sampleEmail: string) {
    setEmail(sampleEmail);
    setPassword('RunsteadPassword123!');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Top Bar */}
      <div className="border-b bg-white py-3 px-4 sm:px-8 flex items-center justify-between">
        <Link href="/demo/storefront-preview" className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {config.businessName} Storefront
        </Link>
        <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-emerald-50 text-[11px] flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-emerald-600" /> Secure Customer Portal
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
            Log in to manage your active hosting services, DNS zones, domains, and billing.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Sign In to Your Account
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your customer email and password to access your services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">Password</Label>
                  <span className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs h-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-xs text-white h-9 shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Portal
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-3 border-t border-slate-100 flex flex-col gap-2.5 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-500 w-full text-left">
              Quick Fill Registered Customers:
            </span>
            <div className="grid grid-cols-2 gap-2 w-full">
              {state.customers.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleFillAccount(c.email)}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-left text-[11px] transition-colors"
                >
                  <div className="font-semibold text-slate-800 truncate">{c.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{c.email}</div>
                </button>
              ))}
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        {config.businessName} • Production Hosting Operating Platform
      </div>
    </div>
  );
}
