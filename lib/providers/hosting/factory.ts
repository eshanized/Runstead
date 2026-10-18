import { CpanelWhmAdapter } from './cpanel-whm.ts';
import { SandboxHostingAdapter } from './sandbox.ts';
import type { HostingProviderAdapter } from './types.ts';
import { prisma } from '../../db/client.ts';
import { decryptData } from '../../security/encryption.ts';
import { env } from '../../config/env.ts';

export class ProviderUnavailableError extends Error {
  constructor(message = 'Hosting provider is not configured or reachable.') {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}

/**
 * Hosting provider factory.
 * Resolves configured tenant credentials or system environment variables.
 * Fails closed in production if no valid provider configuration exists.
 * Sandbox adapter is strictly restricted to explicit demo or non-production test mode.
 */
export async function getHostingProvider(
  tenantId?: string,
  options: { allowSandbox?: boolean } = {}
): Promise<HostingProviderAdapter> {
  // 1. If explicit demo/test sandbox requested and permitted
  if (options.allowSandbox && (process.env.NODE_ENV === 'test' || env.NEXT_PUBLIC_ENABLE_DEMO === 'true')) {
    return new SandboxHostingAdapter();
  }

  // 2. Check if tenant has encrypted WHM credentials stored in PostgreSQL database
  if (tenantId) {
    try {
      const cred = await prisma.providerCredential.findFirst({
        where: {
          tenantId,
          providerName: 'cpanel_whm',
          status: 'connected',
        },
      });

      if (cred && cred.encryptedConfig) {
        const decrypted = decryptData<{ host: string; user: string; apiToken: string; port?: number }>(
          cred.encryptedConfig as any
        );
        if (decrypted.host && decrypted.user && decrypted.apiToken) {
          return new CpanelWhmAdapter(decrypted);
        }
      }
    } catch {
      // Failed lookup or decryption
    }
  }

  // 3. Check system-wide environment variables
  if (env.CPANEL_WHM_HOST && env.CPANEL_WHM_USER && env.CPANEL_WHM_API_TOKEN) {
    return new CpanelWhmAdapter({
      host: env.CPANEL_WHM_HOST,
      user: env.CPANEL_WHM_USER,
      apiToken: env.CPANEL_WHM_API_TOKEN,
    });
  }

  // 4. Test mode fallback
  if (process.env.NODE_ENV === 'test') {
    return new SandboxHostingAdapter();
  }

  // 5. Fail closed in production/live mode
  throw new ProviderUnavailableError(
    `No hosting provider adapter configured for tenant "${tenantId || 'system'}". Please configure WHM credentials.`
  );
}
