'use client';

export {
  DemoProvider as ResellerStoreProvider,
  useDemo as useResellerStore,
  CURRENT_STORAGE_VERSION,
  generateId,
  validateStoredDemoState,
} from '@/lib/demo/store';

export type { DemoState as ResellerState } from '@/lib/demo/types';
