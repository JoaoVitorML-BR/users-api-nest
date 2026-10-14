import { encryptTwoFactorSecret, decryptTwoFactorSecret } from './crypto.util';

describe('CryptoUtil', () => {
  it('should encrypt and decrypt a string successfully', () => {
    const plain = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptTwoFactorSecret(plain);

    expect(encrypted).not.toBe(plain);
    expect(encrypted.split(':')).toHaveLength(3);

    const decrypted = decryptTwoFactorSecret(encrypted);
    expect(decrypted).toBe(plain);
  });

  it('should handle null/empty strings gracefully', () => {
    expect(encryptTwoFactorSecret('')).toBe('');
    expect(decryptTwoFactorSecret('')).toBe('');
  });

  it('should return plain string if not formatted with 3 parts (legacy fallback)', () => {
    const plain = 'LEGACY_SECRET';
    expect(decryptTwoFactorSecret(plain)).toBe(plain);
  });
});
