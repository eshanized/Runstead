'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Server, UserPlus, Building, Mail, Lock, ArrowRight, AlertCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleBusinessNameChange(val: string) {
    setBusinessName(val);
    if (!tenantSlug || tenantSlug === businessName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      setTenantSlug(val.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          businessName: businessName.trim() || undefined,
          tenantSlug: tenantSlug.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Registration failed.');
        toast.error(data.error || 'Registration failed');
        return;
      }

      toast.success('Reseller account created successfully!');
      router.push('/demo/overview');
    } catch {
      setErrorMessage('Network error during registration.');
      toast.error('Failed to create account');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="border-b bg-white py-3 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Server className="h-4 w-4" />
          </span>
          <span>Runstead Platform</span>
        </Link>
        <Link href="/login" className="text-xs font-semibold text-primary hover:underline">
          Existing account? Sign In
        </Link>
      </header>

      <div className="mx-auto max-w-lg w-full px-4 py-8">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
              <UserPlus className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Create Reseller Account</CardTitle>
            <CardDescription className="text-xs">
              Launch your hosting company with white-label storefronts, billing, and automated provisioning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-semibold">Full Name</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@hostpro.io"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="text-sm"
                />
              </div>

              <div className="border-t pt-3 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Reseller Business Profile
                </div>
                <div className="space-y-1">
                  <Label htmlFor="businessName" className="text-xs font-semibold">Hosting Brand Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="businessName"
                      required
                      value={businessName}
                      onChange={(e) => handleBusinessNameChange(e.target.value)}
                      placeholder="e.g. Apex Cloud Hosting"
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="tenantSlug" className="text-xs font-semibold">Storefront Subdomain Slug</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="tenantSlug"
                      required
                      value={tenantSlug}
                      onChange={(e) => setTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="apexcloud"
                      className="pl-9 text-sm font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Your customers will access: <span className="font-mono">{tenantSlug || 'yourbrand'}.runstead.org</span>
                  </p>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full text-sm font-semibold mt-4">
                {isLoading ? 'Creating business account...' : 'Create Reseller Account'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t">
        © 2026 Runstead. Tonmoy Infrastructure & Vision.
      </footer>
    </div>
  );
}
