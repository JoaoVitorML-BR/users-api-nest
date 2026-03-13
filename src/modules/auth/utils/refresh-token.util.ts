import { createHash, timingSafeEqual } from 'crypto';

const REFRESH_TOKEN_ALGORITHM = 'sha256';

export const hashRefreshToken = (refreshToken: string): string => {
  return createHash(REFRESH_TOKEN_ALGORITHM).update(refreshToken).digest('hex');
};

export const compareRefreshToken = (refreshToken: string, storedHash: string | null): boolean => {
  if (!storedHash) {
    return false;
  }

  const refreshTokenHash = hashRefreshToken(refreshToken);
  const refreshTokenBuffer = Buffer.from(refreshTokenHash, 'utf8');
  const storedHashBuffer = Buffer.from(storedHash, 'utf8');

  if (refreshTokenBuffer.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(refreshTokenBuffer, storedHashBuffer);
};
