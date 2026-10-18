import crypto from 'node:crypto';
import { env } from '../config/env.ts';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for AES-GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte master encryption key strictly from ENCRYPTION_KEY.
 * Never silently substitutes AUTH_SECRET or public fallbacks.
 */
function getEncryptionKey(): Buffer {
  const secret = env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY is missing from environment.');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

export interface EncryptedPayload {
  iv: string;
  tag: string;
  ciphertext: string;
}

/**
 * Encrypts a JSON-serializable object or plaintext string using AES-256-GCM.
 */
export function encryptData(data: unknown): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext: encrypted.toString('hex'),
  };
}

/**
 * Decrypts an AES-256-GCM payload and parses as T.
 */
export function decryptData<T = any>(payload: EncryptedPayload): T {
  if (!payload || !payload.iv || !payload.tag || !payload.ciphertext) {
    throw new Error('Invalid encrypted payload structure');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const ciphertext = Buffer.from(payload.ciphertext, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  const decryptedText = decrypted.toString('utf8');

  try {
    return JSON.parse(decryptedText) as T;
  } catch {
    return decryptedText as unknown as T;
  }
}
