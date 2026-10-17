'use client';

import { useDemo } from '@/lib/demo/store';
import { StorefrontLayout } from '@/components/storefront/storefront-layout';
import { SectionRenderer } from '@/components/storefront/section-renderer';

export default function StorefrontPreviewPage() {
  const { state } = useDemo();
  const config = state.publishedStorefront || state.storefront;

  return (
    <StorefrontLayout overrideConfig={config}>
      <SectionRenderer sections={config.sections} config={config} />
    </StorefrontLayout>
  );
}
