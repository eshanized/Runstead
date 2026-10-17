/**
 * Runstead Production & Demo Separation Boundary
 * 
 * Enforces strict isolation between interactive demo simulation
 * and authenticated production operations.
 */

export type ExecutionMode = 'production' | 'demo';

export interface OperationContext {
  mode: ExecutionMode;
  tenantId?: string;
  userId?: string;
  customerId?: string;
  isPlatformAdmin?: boolean;
}

export class ProductionBoundaryError extends Error {
  constructor(message: string) {
    super(`[ProductionBoundaryViolation] ${message}`);
    this.name = 'ProductionBoundaryError';
  }
}

/**
 * Asserts that the current operation is executing in genuine production mode.
 * Throws if demo mode attempts to invoke production mutations or live APIs.
 */
export function assertProductionContext(context: OperationContext): void {
  if (context.mode === 'demo') {
    throw new ProductionBoundaryError(
      'Attempted to execute an authoritative production mutation within demo context. ' +
      'Demo actions must be sandboxed and must never mutate PostgreSQL production tables or trigger live external APIs.'
    );
  }
}

/**
 * Asserts that live credentials or payment gateways are not invoked during demo simulations.
 */
export function assertSafeDemoProviderCall(mode: ExecutionMode, providerName: string): void {
  if (mode === 'demo' && !providerName.startsWith('mock') && !providerName.startsWith('sandbox')) {
    throw new ProductionBoundaryError(
      `Illegal attempt to invoke live provider "${providerName}" from interactive demo mode. ` +
      'Demo mode must route exclusively through sandbox or in-memory fixtures.'
    );
  }
}

/**
 * Determines whether a given request URL or header belongs to the demo environment.
 */
export function isDemoPathOrHeader(pathname?: string, headerMode?: string | null): boolean {
  if (headerMode === 'demo') return true;
  if (!pathname) return false;
  return pathname.startsWith('/demo') || pathname.startsWith('/api/demo');
}
