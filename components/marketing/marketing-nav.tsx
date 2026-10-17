'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ChevronDown, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { marketingNav } from '@/lib/config/navigation';
import { siteConfig } from '@/lib/config/site';
import { cn } from '@/lib/utils';

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Server className="h-5 w-5" />
          </span>
          <span>{siteConfig.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {marketingNav.map((item) => (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
                {item.children && <ChevronDown className="h-3.5 w-3.5" />}
              </Link>
              {item.children && (
                <div className="invisible absolute left-0 top-full z-50 w-64 translate-y-1 pt-2 opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="rounded-lg border bg-popover p-2 shadow-lg">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                      >
                        <div className="font-medium text-foreground">{child.label}</div>
                        {child.description && (
                          <div className="text-xs text-muted-foreground">{child.description}</div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/overview">Console</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Get Started</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <div className="mt-6 flex flex-col gap-1">
              {marketingNav.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
              {marketingNav[0]?.children?.map((child) => (
                <SheetClose asChild key={child.href}>
                  <Link
                    href={child.href}
                    className="ml-3 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                  >
                    {child.label}
                  </Link>
                </SheetClose>
              ))}
              <div className="mt-4 flex flex-col gap-2">
                <SheetClose asChild>
                  <Button asChild variant="outline">
                    <Link href="/login">Sign in</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild variant="secondary">
                    <Link href="/dashboard/overview">Console</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild>
                    <Link href="/register">Get Started</Link>
                  </Button>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
