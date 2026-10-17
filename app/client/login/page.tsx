'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { usePlatformStore } from '@/lib/store/platform-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ClientLoginPage() {
  const router = useRouter();
  const { state } = usePlatformStore();
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
        throw new Error(data.error || 'Invalid credentials');
      }

      toast.success(`Welcome back, ${data.user?.name || 'Customer'}!`);
      router.push('/client/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Top Bar */}
      <div className="border-b bg-white py-3 px-4 sm:px-8 flex items-center justify-between">
        <Link href="/storefront" className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {config.businessName} Storefront
        </Link>
        <Link href="/dashboard/overview" className="text-xs text-slate-500 hover:text-slate-800">
          Reseller Portal →
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="mx-auto max-w-md w-full px-4 py-8">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1 text-center pb-4">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md mb-2 font-bold text-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
              Customer Hosting Control Center
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Sign in with your verified account credentials to manage your hosting services, domains, DNS zones, and invoices.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
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

          <CardFooter className="pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 text-xs text-slate-500">
            <span>New customer?</span>
            <Link href="/storefront/hosting" className="font-semibold text-slate-800 hover:underline">
              Order a hosting plan →
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-slate-200 text-xs text-slate-400">
        Secured by Runstead Infrastructure Engine • Authenticated Multi-Tenant Access
      </div>
    </div>
  );
}
