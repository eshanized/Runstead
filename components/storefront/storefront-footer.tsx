'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Globe, Twitter, Github, Linkedin, MessageSquare } from 'lucide-react';
import type { StorefrontConfig } from '@/lib/demo/types';

interface StorefrontFooterProps {
  config: StorefrontConfig;
}

export function StorefrontFooter({ config }: StorefrontFooterProps) {
  const primaryColor = config.primaryColor || '#0f5fff';
  const logoText = config.logoText || config.businessName.slice(0, 2).toUpperCase() || 'CV';

  const footer = config.footer || {
    layout: 'columns',
    showContact: true,
    showSocials: true,
    socialLinks: [],
    columns: [],
  };

  const branding = config.branding || {
    businessName: config.businessName,
    tagline: config.tagline,
    email: config.email,
    phone: config.phone,
    showPlatformAttribution: false,
    copyrightText: `© ${new Date().getFullYear()} ${config.businessName}. All rights reserved.`,
  };

  const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    twitter: Twitter,
    github: Github,
    linkedin: Linkedin,
    discord: MessageSquare,
  };

  return (
    <footer className="border-t bg-slate-900 text-slate-300 mt-auto transition-colors" style={{ borderTopColor: `${primaryColor}30` }}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info & Contact */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/storefront" className="flex items-center gap-2.5">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.logoAlt || config.businessName}
                  className="h-8 w-auto max-w-[130px] object-contain rounded"
                />
              ) : (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {logoText}
                </span>
              )}
              <span className="font-bold text-lg text-white tracking-tight">{config.businessName}</span>
            </Link>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {config.tagline || 'Modern cloud hosting, scalable virtual servers, and secure domain registrations.'}
            </p>

            {footer.showContact && (
              <div className="space-y-1.5 pt-2 text-xs text-slate-400">
                {config.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <a href={`mailto:${config.email}`} className="hover:text-white transition-colors">
                      {config.email}
                    </a>
                  </div>
                )}
                {config.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <a href={`tel:${config.phone}`} className="hover:text-white transition-colors">
                      {config.phone}
                    </a>
                  </div>
                )}
              </div>
            )}

            {footer.showSocials && footer.socialLinks && footer.socialLinks.length > 0 && (
              <div className="flex items-center gap-3 pt-3">
                {footer.socialLinks
                  .filter((s) => s.enabled)
                  .map((social) => {
                    const Icon = socialIcons[social.platform] || Globe;
                    return (
                      <a
                        key={social.platform}
                        href={social.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={social.platform}
                        className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </a>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Navigation Columns */}
          {footer.columns &&
            footer.columns.map((column) => (
              <div key={column.id} className="space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">{column.title}</h4>
                <ul className="space-y-2 text-xs">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-slate-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>

        {/* Bottom Bar: Copyright & White-Label Attribution */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            {branding.copyrightText || `© ${new Date().getFullYear()} ${config.businessName}. All rights reserved.`}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/storefront/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/storefront/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/storefront/status" className="hover:text-white transition-colors">
              System Status
            </Link>
          </div>

          {/* White-label attribution: only rendered if explicitly enabled in branding configuration */}
          {branding.showPlatformAttribution && (
            <div className="text-[11px] text-slate-400">
              Powered by <span className="text-slate-300 font-semibold">Runstead</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
