import Link from 'next/link';
import { Server } from 'lucide-react';
import { footerNav } from '@/lib/config/navigation';
import { siteConfig } from '@/lib/config/site';

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Server className="h-5 w-5" />
              </span>
              {siteConfig.name}
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              {siteConfig.description}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              A project by {siteConfig.company}.
            </p>
          </div>
          {footerNav.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold">{section.title}</h4>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteConfig.company}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="text-xs text-muted-foreground hover:text-foreground">About</Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground">Terms</Link>
            <Link href="/contact" className="text-xs text-muted-foreground hover:text-foreground">Contact</Link>
            <Link href="/demo/overview" className="text-xs text-muted-foreground hover:text-foreground">Console</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
