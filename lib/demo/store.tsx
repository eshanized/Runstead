'use client';

// Production platform re-export bridge
export {
  PlatformProvider as DemoProvider,
  PlatformProvider,
  usePlatformStore as useDemo,
  usePlatformStore,
  generateId,
  CURRENT_STORAGE_VERSION,
  validateStoredDemoState,
} from '../store/platform-store';

export type { PlatformState as DemoState, PlatformState } from '../types/platform';
