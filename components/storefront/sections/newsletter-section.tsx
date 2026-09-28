'use client';

import { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { StorefrontConfig, StorefrontSection } from '@/lib/demo/types';

interface NewsletterSectionProps {
  section: StorefrontSection;
  config: StorefrontConfig;
}

export function NewsletterSection({ section, config }: NewsletterSectionProps) {
  const settings = section.settings || {};
  const primaryColor = config.primaryColor || '#0f5fff';

  const headline = settings.headline || 'Stay updated on infrastructure & security';
  const description =
    settings.description ||
    'Subscribe to receive maintenance notifications, hosting optimization guides, and service updates.';
  const buttonText = settings.buttonText || 'Subscribe';

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubscribed(true);
    toast.success('Thank you for subscribing to simulated hosting alerts!');
  }

  return (
    <section className="bg-slate-50 py-16 sm:py-20 border-b border-slate-100">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{headline}</h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">{description}</p>

        {subscribed ? (
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>You have been subscribed to our simulated announcement list.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-10 text-xs bg-white"
                required
              />
            </div>
            <Button
              type="submit"
              className="text-white text-xs font-semibold h-10 px-5 shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              {buttonText}
            </Button>
          </form>
        )}

        <div className="text-[11px] text-slate-400">
          Simulated newsletter signup for demo demonstration. We respect your inbox privacy.
        </div>
      </div>
    </section>
  );
}
