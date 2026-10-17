import net from 'node:net';

export class SsrfSecurityError extends Error {
  constructor(message: string) {
    super(`[SsrfBlocked] ${message}`);
    this.name = 'SsrfSecurityError';
  }
}

/**
 * Checks whether an IP address falls into a reserved or private range.
 */
export function isPrivateIp(ip: string): boolean {
  if (!net.isIP(ip)) return false;

  // IPv4 private & reserved checks
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (Link-local / AWS / Cloud metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    // 224.0.0.0/4 (Multicast)
    if (parts[0] >= 224 && parts[0] <= 239) return true;
    // 240.0.0.0/4 (Reserved)
    if (parts[0] >= 240) return true;
  }

  // IPv6 loopback & link-local
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true;
  }

  return false;
}

/**
 * Validates an external provider host or URL to prevent Server-Side Request Forgery (SSRF).
 * Allows localhost only in local development / test environments if explicitly permitted.
 */
export function validateSafeEndpoint(urlOrHost: string, allowLocalInDev = true): URL {
  let targetUrl: URL;
  try {
    targetUrl = urlOrHost.startsWith('http://') || urlOrHost.startsWith('https://')
      ? new URL(urlOrHost)
      : new URL(`https://${urlOrHost}`);
  } catch {
    throw new SsrfSecurityError(`Malformed endpoint URL: ${urlOrHost}`);
  }

  const hostname = targetUrl.hostname.toLowerCase();

  // Cloud metadata endpoint hostnames
  if (
    hostname === 'instance-data' ||
    hostname === 'metadata.google.internal' ||
    hostname.includes('169.254.169.254')
  ) {
    throw new SsrfSecurityError(`Blocked attempt to access cloud metadata endpoint: ${hostname}`);
  }

  // Localhost checks
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    if (allowLocalInDev && process.env.NODE_ENV !== 'production') {
      return targetUrl;
    }
    throw new SsrfSecurityError(`Access to localhost is prohibited in production: ${hostname}`);
  }

  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    if (allowLocalInDev && process.env.NODE_ENV !== 'production') {
      return targetUrl;
    }
    throw new SsrfSecurityError(`Endpoint resolves to a private or reserved network IP: ${hostname}`);
  }

  return targetUrl;
}
