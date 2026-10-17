const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'secret',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'apitoken',
  'api_token',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'creditcard',
  'cardnumber',
  'cvv',
  'encryptedconfig',
  'encrypted_config',
  'privatekey',
  'private_key',
]);

/**
 * Deeply redacts sensitive keys from an object or payload before logging or storage.
 */
export function redactSensitiveData<T = any>(obj: T, depth = 0): T {
  if (depth > 8 || obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Redact bearer tokens or basic auth strings
    if (obj.toLowerCase().startsWith('bearer ') || obj.toLowerCase().startsWith('basic ')) {
      return '[REDACTED_AUTH_HEADER]' as unknown as T;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const copy: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const normalizedKey = key.toLowerCase().replace(/[-_]/g, '');
      if (SENSITIVE_KEYS.has(normalizedKey)) {
        copy[key] = '[REDACTED]';
      } else {
        copy[key] = redactSensitiveData(value, depth + 1);
      }
    }
    return copy as T;
  }

  return obj;
}
