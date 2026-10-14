export const parseExpiresInToSeconds = (
  expiresIn?: string | number,
): number => {
  if (expiresIn === undefined || expiresIn === null) {
    return 3600;
  }

  if (typeof expiresIn === 'number') {
    return Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600;
  }

  const trimmed = expiresIn.trim();
  const match = /^(\d+)\s*([smhdw])$/i.exec(trimmed);
  if (!match) {
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3600;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 's') return value;
  if (unit === 'm') return value * 60;
  if (unit === 'h') return value * 3600;
  if (unit === 'd') return value * 86400;
  if (unit === 'w') return value * 604800;

  return 3600;
};
