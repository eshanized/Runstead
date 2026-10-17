'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ContactUsPage() {
  const { state } = useDemo();
  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitted(true);
    toast.success('Your message has been sent to our simulated support queue!');
  }

  return (
    <StorefrontLayout overrideConfig={config}>
      <div className="bg-slate-50/60 py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white">
              Contact Our Team
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Contact {config.businessName}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Have questions about hosting plans, custom server configurations, or migrations? We are here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 items-start">
            {/* Contact Details */}
            <div className="md:col-span-5 space-y-6">
              <Card className="border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Direct Inquiries</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Reach our sales, billing, and technical staff.</p>
                </div>

                <div className="space-y-4 text-xs text-slate-600">
                  {config.email && (
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Email Address</div>
                        <a href={`mailto:${config.email}`} className="text-slate-600 hover:text-blue-600 transition-colors">
                          {config.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {config.phone && (
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Telephone</div>
                        <a href={`tel:${config.phone}`} className="text-slate-600 hover:text-blue-600 transition-colors">
                          {config.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Office Location</div>
                      <div>{state.business.address || '123 Innovation Drive, San Francisco, CA'}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-100 space-y-1">
                  <div className="font-semibold text-slate-700">Existing Customer?</div>
                  <div>
                    If you have an active hosting account, opening a ticket through the{' '}
                    <a href="/client/login" className="text-blue-600 font-semibold underline">
                      Customer Portal
                    </a>{' '}
                    provides immediate technical queue priority.
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-7">
              <Card className="border border-slate-200 bg-white shadow-xs">
                {submitted ? (
                  <CardContent className="p-8 text-center space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-slate-900">Message Received!</h3>
                      <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                        Thank you for reaching out, <strong>{name}</strong>. Our staff has received your simulated inquiry and will reply shortly to <strong>{email}</strong>.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSubmitted(false);
                        setName('');
                        setEmail('');
                        setSubject('');
                        setMessage('');
                      }}
                      className="text-xs"
                    >
                      Send Another Message
                    </Button>
                  </CardContent>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <CardContent className="p-6 space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="contactName" className="text-xs font-semibold text-slate-700">Full Name</Label>
                          <Input
                            id="contactName"
                            placeholder="Alex Mercer"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-xs h-10"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="contactEmail" className="text-xs font-semibold text-slate-700">Email Address</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            placeholder="alex@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="text-xs h-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="contactSubject" className="text-xs font-semibold text-slate-700">Subject</Label>
                        <Input
                          id="contactSubject"
                          placeholder="Questions about VPS scaling / DNS migration..."
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="text-xs h-10"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="contactMessage" className="text-xs font-semibold text-slate-700">Message</Label>
                        <Textarea
                          id="contactMessage"
                          placeholder="How can we assist your business?"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={5}
                          className="text-xs"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full text-white font-semibold text-xs h-10 shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Send className="mr-2 h-3.5 w-3.5" />
                        Send Simulated Inquiry
                      </Button>
                    </CardContent>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
