'use client';

import { DemoProvider } from '@/lib/demo/store';

export default function DemoRootLayout({ children }: { children: React.ReactNode }) {
  return <DemoProvider>{children}</DemoProvider>;
}
