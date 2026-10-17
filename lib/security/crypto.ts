import crypto from 'node:crypto';

/**
 * PBKDF2/scrypt password hashing implementation.
 * Uses Node.js crypto standard library without external binary dependencies.
 */
const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;

/**
 * Hashes a plaintext password using scrypt with a unique 16-byte cryptographically secure salt.
 * Returns formatted string: `scrypt$N=16384,r=8,p=1$<salt_hex>$<hash_hex>`
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const salt = crypto.randomBytes(16).toString('hex');

  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_COST, r: SCRYPT_BLOCK_SIZE, p: SCRYPT_PARALLELIZATION },
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`scrypt$N=${SCRYPT_COST},r=${SCRYPT_BLOCK_SIZE},p=${SCRYPT_PARALLELIZATION}$${salt}$${derivedKey.toString('hex')}`);
      }
    );
  });
}

/**
 * Verifies a plaintext password against a stored scrypt hash using constant-time equality check.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash || typeof storedHash !== 'string') {
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt') {
    return false;
  }

  const salt = parts[2];
  const expectedHashHex = parts[3];
  const expectedBuffer = Buffer.from(expectedHashHex, 'hex');

  return new Promise((resolve) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_COST, r: SCRYPT_BLOCK_SIZE, p: SCRYPT_PARALLELIZATION },
      (err, derivedKey) => {
        if (err) return resolve(false);
        if (derivedKey.length !== expectedBuffer.length) return resolve(false);
        try {
          const match = crypto.timingSafeEqual(derivedKey, expectedBuffer);
          resolve(match);
        } catch {
          resolve(false);
        }
      }
    );
  });
}

/**
 * Generates a cryptographically secure random token (hex string).
 */
export function generateSecureToken(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Computes a SHA-256 hash of a string (useful for indexing and looking up tokens securely).
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
