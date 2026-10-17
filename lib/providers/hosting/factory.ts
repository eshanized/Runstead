import { CpanelWhmAdapter } from './cpanel-whm.ts';
import { SandboxHostingAdapter } from './sandbox.ts';
import type { HostingProviderAdapter } from './types.ts';
import { prisma } from '../../db/client.ts';
import { decryptData } from '../../security/encryption.ts';
import { env } from '../../config/env.ts';

/**
 * Hosting provider factory.
 * Resolves configured tenant credentials or system environment variables,
 * falling back safely to the sandbox adapter when unconfigured.
 */
export async function getHostingProvider(tenantId?: string): Promise<HostingProviderAdapter> {
  // 1. Check if tenant has encrypted WHM credentials stored in database
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
      // Fall through to environment settings or sandbox
    }
  }

  // 2. Check system-wide environment variables
  if (env.CPANEL_WHM_HOST && env.CPANEL_WHM_USER && env.CPANEL_WHM_API_TOKEN) {
    return new CpanelWhmAdapter({
      host: env.CPANEL_WHM_HOST,
      user: env.CPANEL_WHM_USER,
      apiToken: env.CPANEL_WHM_API_TOKEN,
    });
  }

  // 3. Sandbox Fallback
  return new SandboxHostingAdapter();
}
