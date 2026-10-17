'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Server, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed. Please verify credentials.');
        toast.error(data.error || 'Login failed');
        return;
      }

      toast.success(`Welcome back, ${data.user.name}!`);
      
      if (data.user.isPlatformAdmin) {
        router.push('/demo/platform-admin');
      } else if (data.tenants && data.tenants.length > 0) {
        router.push('/demo/overview');
      } else {
        router.push('/demo/overview');
      }
    } catch {
      setErrorMessage('Network error connecting to authentication server.');
      toast.error('Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation header */}
      <header className="border-b bg-white py-3 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Server className="h-4 w-4" />
          </span>
          <span>Runstead Platform</span>
        </Link>
        <Link href="/demo" className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Explore Interactive Demo
        </Link>
      </header>

      {/* Main card */}
      <div className="mx-auto max-w-md w-full px-4 py-12">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Sign In to Runstead</CardTitle>
            <CardDescription className="text-xs">
              Authoritative PostgreSQL-authenticated portal for platform operators and resellers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reseller@example.com"
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full text-sm font-semibold">
                {isLoading ? 'Verifying credentials...' : 'Sign In'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 text-center border-t pt-4">
            <p className="text-xs text-muted-foreground">
              New reseller business?{' '}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Register account
              </Link>
            </p>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900 text-left">
              <strong>Need to test without credentials?</strong> Visitors can explore the{' '}
              <Link href="/demo" className="underline font-semibold text-amber-950">
                zero-credential interactive demo
              </Link>{' '}
              with populated simulation data.
            </div>
          </CardFooter>
        </Card>
      </div>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t">
        © 2026 Runstead. Tonmoy Infrastructure & Vision.
      </footer>
    </div>
  );
}
