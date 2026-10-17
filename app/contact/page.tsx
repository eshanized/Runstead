'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, MessageSquare, Send, ArrowRight } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { siteConfig } from '@/lib/config/site';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email address';
    if (!message.trim()) e.message = 'Message is required';
    else if (message.trim().length < 10) e.message = 'Message must be at least 10 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (validate()) {
      setSubmitted(true);
    }
  }

  return (
    <MarketingLayout>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Contact"
            title="Get in touch with the team"
            description="Whether you are an investor, a potential partner, or a hosting business evaluating the platform, we would like to hear from you."
          />
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <Mail className="h-8 w-8 text-accent" />
                  <h3 className="mt-3 font-semibold">Email</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{siteConfig.contactEmail}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <MessageSquare className="h-8 w-8 text-accent" />
                  <h3 className="mt-3 font-semibold">Investor inquiries</h3>
                  <p className="mt-1 text-sm text-muted-foreground">For investment discussions, please reach out with information about your fund and investment thesis.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Send className="h-8 w-8 text-accent" />
                  <h3 className="mt-3 font-semibold">Partnerships</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Hosting providers, domain registrars, and payment gateways interested in integration are welcome to contact us.</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                      <Send className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 font-semibold">Message sent successfully</h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                      Thank you for contacting Runstead. A member of our infrastructure team will respond to your inquiry shortly.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => { setSubmitted(false); setName(''); setEmail(''); setCompany(''); setMessage(''); }}>
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="font-semibold">Send a message</h3>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                      {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company (optional)" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us about your interest..." rows={5} />
                      {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                    </div>
                    <Button type="submit" className="w-full">Send message</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          <Alert className="border-emerald-200 bg-emerald-50/50">
            <AlertTitle className="text-emerald-900 font-semibold">Direct Communication</AlertTitle>
            <AlertDescription className="text-emerald-800 text-xs mt-1">
              For security advisories or immediate enterprise onboarding inquiries, you can also reach us directly at {siteConfig.contactEmail}.
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button asChild variant="outline"><Link href="/dashboard/overview">Open Platform Console <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
