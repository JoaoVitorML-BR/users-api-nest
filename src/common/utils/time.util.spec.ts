import { parseExpiresInToSeconds } from './time.util';

describe('TimeUtil', () => {
  it('should parse seconds, minutes, hours, days, weeks', () => {
    expect(parseExpiresInToSeconds('30s')).toBe(30);
    expect(parseExpiresInToSeconds('15m')).toBe(900);
    expect(parseExpiresInToSeconds('1h')).toBe(3600);
    expect(parseExpiresInToSeconds('7d')).toBe(604800);
    expect(parseExpiresInToSeconds('1w')).toBe(604800);
  });

  it('should handle pure numbers and numeric strings', () => {
    expect(parseExpiresInToSeconds(1800)).toBe(1800);
    expect(parseExpiresInToSeconds('7200')).toBe(7200);
  });

  it('should fallback to 3600 for invalid inputs', () => {
    expect(parseExpiresInToSeconds(undefined)).toBe(3600);
    expect(parseExpiresInToSeconds(null as any)).toBe(3600);
    expect(parseExpiresInToSeconds('invalid')).toBe(3600);
    expect(parseExpiresInToSeconds(-5)).toBe(3600);
  });
});
