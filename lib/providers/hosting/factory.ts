import { CpanelWhmAdapter } from './cpanel-whm.ts';
import { SandboxHostingAdapter } from './sandbox.ts';
import type { HostingProviderAdapter } from './types.ts';
import { withTenantContext } from '../../db/client.ts';
import { decryptData } from '../../security/encryption.ts';
import { env } from '../../config/env.ts';

export class ProviderUnavailableError extends Error {
  constructor(message = 'Hosting provider is not configured or reachable.') {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}

/**
 * Resolves a verified tenant provider. Tenant credential read/decryption failures
 * fail closed; they must never fall back to a different tenant's or global credential.
 */
export async function getHostingProvider(
  tenantId?: string,
  options: { allowSandbox?: boolean } = {}
): Promise<HostingProviderAdapter> {
  if (process.env.NODE_ENV !== 'production' && options.allowSandbox && (process.env.NODE_ENV === 'test' || env.NEXT_PUBLIC_ENABLE_DEMO === 'true')) {
    return new SandboxHostingAdapter();
  }

  if (tenantId) {
    let cred;
    try {
      cred = await withTenantContext(tenantId, (tx) => tx.providerCredential.findFirst({
        where: {
          tenantId,
          providerName: 'cpanel_whm',
          status: 'connected',
        },
      }));
    } catch {
      if (process.env.NODE_ENV === 'test') return new SandboxHostingAdapter();
      throw new ProviderUnavailableError('Unable to read the tenant hosting credentials. No fallback provider was selected.');
    }

    if (cred) {
      if (!cred.encryptedConfig) {
        throw new ProviderUnavailableError('The tenant hosting credentials are incomplete. Reconnect the provider.');
      }
      let decrypted: { host: string; user: string; apiToken: string; port?: number };
      try {
        decrypted = decryptData<typeof decrypted>(cred.encryptedConfig as any);
      } catch {
        throw new ProviderUnavailableError('The tenant hosting credentials could not be decrypted. Reconnect the provider.');
      }
      if (!decrypted.host || !decrypted.user || !decrypted.apiToken) {
        throw new ProviderUnavailableError('The tenant hosting credentials are incomplete. Reconnect the provider.');
      }
      return new CpanelWhmAdapter(decrypted);
    }
  }

  // Shared host-level credentials are allowed only when explicitly enabled.
  const mayUseSharedCredential =
    !tenantId || env.CPANEL_WHM_ALLOW_SHARED_PROVIDER === 'true';

  if (
    mayUseSharedCredential &&
    env.CPANEL_WHM_HOST &&
    env.CPANEL_WHM_USER &&
    env.CPANEL_WHM_API_TOKEN
  ) {
    return new CpanelWhmAdapter({
      host: env.CPANEL_WHM_HOST,
      user: env.CPANEL_WHM_USER,
      apiToken: env.CPANEL_WHM_API_TOKEN,
    });
  }

  if (process.env.NODE_ENV === 'test') {
    return new SandboxHostingAdapter();
  }

  throw new ProviderUnavailableError(
    tenantId
      ? 'No hosting provider is configured for this tenant. Configure tenant credentials or explicitly authorize shared host-level credentials.'
      : 'No system hosting provider is configured.'
  );
}
