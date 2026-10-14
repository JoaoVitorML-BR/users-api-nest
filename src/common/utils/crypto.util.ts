import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96 bits for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Returns a 32-byte key derived from environment variables.
 */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.TWO_FACTOR_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'default_dev_fallback_secret_32bytes_key!!';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plaintext secret using AES-256-GCM.
 * Output format: iv:authTag:encryptedHex
 */
export function encryptTwoFactorSecret(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted secret formatted as iv:authTag:encryptedHex.
 * If the input is not in the expected format (e.g., legacy plaintext in dev/test), returns the input.
 */
export function decryptTwoFactorSecret(ciphertext: string): string {
  if (!ciphertext) return ciphertext;

  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    // If not formatted as encrypted string (legacy or plain secret), return as is
    return ciphertext;
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (_error) {
    // If decryption fails, it might be a raw plaintext string in legacy data/mock
    return ciphertext;
  }
}
