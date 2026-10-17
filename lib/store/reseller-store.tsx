'use client';

export {
  PlatformProvider as ResellerStoreProvider,
  usePlatformStore as useResellerStore,
  usePlatformStore as useDemo,
  CURRENT_STORAGE_VERSION,
  generateId,
  validateStoredDemoState,
} from './platform-store';

export type { PlatformState as ResellerState, PlatformState as DemoState } from '@/lib/types/platform';
