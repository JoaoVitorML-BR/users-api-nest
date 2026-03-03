export const parseExpiresInToSeconds = (expiresIn: string): number => {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
        const parsed = Number(expiresIn);
        return Number.isFinite(parsed) ? parsed : 3600;
    }

    const value = Number(match[1]);
    const unit = match[2];

    if (unit === 's') return value;
    if (unit === 'm') return value * 60;
    if (unit === 'h') return value * 3600;
    if (unit === 'd') return value * 86400;

    return 3600;
};
