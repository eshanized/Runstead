import { env } from '../config/env.ts';

/**
 * Validates and sanitizes a client-provided redirect URL against safe origins.
 * Prevents open-redirect vulnerabilities.
 */
export function isAllowedRedirectUrl(urlStr: string, requestOrigin?: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;

  // Relative paths are safe within the application
  if (urlStr.startsWith('/') && !urlStr.startsWith('//') && !urlStr.includes('\\')) {
    return true;
  }

  const allowedOrigins = new Set<string>();
  if (requestOrigin) {
    try {
      allowedOrigins.add(new URL(requestOrigin).origin);
    } catch {
      // Ignore
    }
  }

  if (env.NEXT_PUBLIC_APP_URL) {
    try {
      allowedOrigins.add(new URL(env.NEXT_PUBLIC_APP_URL).origin);
    } catch {
      // Ignore
    }
  }

  try {
    const parsed = new URL(urlStr);
    // Explicitly reject dangerous schemes like javascript:, data:, etc.
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    return allowedOrigins.has(parsed.origin);
  } catch {
    return false;
  }
}

export function sanitizeRedirectUrl(urlStr: string | undefined, requestOrigin: string, defaultPath: string): string {
  if (urlStr && isAllowedRedirectUrl(urlStr, requestOrigin)) {
    if (urlStr.startsWith('/')) {
      return new URL(urlStr, requestOrigin).toString();
    }
    return urlStr;
  }
  return new URL(defaultPath, requestOrigin).toString();
}
