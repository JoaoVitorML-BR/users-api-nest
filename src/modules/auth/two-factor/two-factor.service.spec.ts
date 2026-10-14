import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import * as bcrypt from 'bcrypt';
import { TwoFactorService } from './two-factor.service';
import { UserService } from 'src/modules/users/user.service';
import { AuthService } from '../auth.service';
import { ROLE } from 'src/modules/users/user.entity';

jest.mock('bcrypt');

describe('TwoFactorService', () => {
  let service: TwoFactorService;

  const mockUserService = {
    findByIdWithTwoFactorSecret: jest.fn(),
    setTwoFactor: jest.fn(),
    updateRefreshToken: jest.fn(),
  };

  const mockAuthService = {
    generateAccessToken: jest.fn(),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'APP_NAME') return 'TestApp';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSecret', () => {
    it('should generate a secret, store it in the database, and return qrCodeDataUrl', async () => {
      const user = { id: 'user-1', email: 'test@example.com' };
      mockUserService.setTwoFactor.mockResolvedValue(true);

      const result = await service.generateSecret(user);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeDataUrl');
      expect(result).toHaveProperty('otpAuthUrl');
      expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
      // Verify the secret was persisted in the DB with isTwoFactorEnabled = false
      expect(mockUserService.setTwoFactor).toHaveBeenCalledWith(
        'user-1',
        false,
        result.secret,
      );
    });
  });

  describe('enableTwoFactor', () => {
    it('should enable 2FA when code is valid (secret fetched from DB)', async () => {
      const user = { id: 'user-1' };
      const secret = authenticator.generateSecret();
      const code = authenticator.generate(secret);

      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue({
        id: 'user-1',
        twoFactorSecret: secret,
        isTwoFactorEnabled: false,
      } as any);
      mockUserService.setTwoFactor.mockResolvedValue(true);

      await expect(
        service.enableTwoFactor(user, { code }),
      ).resolves.toBeUndefined();
      expect(mockUserService.setTwoFactor).toHaveBeenCalledWith(
        'user-1',
        true,
        secret,
      );
    });

    it('should throw BadRequestException when code is invalid', async () => {
      const user = { id: 'user-1' };
      const secret = authenticator.generateSecret();

      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue({
        id: 'user-1',
        twoFactorSecret: secret,
        isTwoFactorEnabled: false,
      } as any);

      await expect(
        service.enableTwoFactor(user, { code: '000000' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no pending secret exists', async () => {
      const user = { id: 'user-1' };

      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue({
        id: 'user-1',
        twoFactorSecret: null,
        isTwoFactorEnabled: false,
      } as any);

      await expect(
        service.enableTwoFactor(user, { code: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when 2FA is already enabled', async () => {
      const user = { id: 'user-1' };
      const secret = authenticator.generateSecret();

      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue({
        id: 'user-1',
        twoFactorSecret: secret,
        isTwoFactorEnabled: true,
      } as any);

      await expect(
        service.enableTwoFactor(user, { code: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('disableTwoFactor', () => {
    it('should disable 2FA when password and code are valid', async () => {
      const user = { id: 'user-1' };
      const secret = authenticator.generateSecret();
      const code = authenticator.generate(secret);
      const fullUser = {
        id: 'user-1',
        password: '$2b$10$hashedPassword',
        isTwoFactorEnabled: true,
        twoFactorSecret: secret,
      };

      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue(
        fullUser as any,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserService.setTwoFactor.mockResolvedValue(true);

      await expect(
        service.disableTwoFactor(user, { password: 'Password@123', code }),
      ).resolves.toBeUndefined();
      expect(mockUserService.setTwoFactor).toHaveBeenCalledWith(
        'user-1',
        false,
        null,
      );
    });

    it('should throw BadRequestException if 2FA is not enabled', async () => {
      const user = { id: 'user-1' };
      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue({
        id: 'user-1',
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
      } as any);

      await expect(
        service.disableTwoFactor(user, { password: 'pass', code: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const user = { id: 'user-1' };
      const secret = authenticator.generateSecret();
      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue({
        id: 'user-1',
        password: 'hash',
        isTwoFactorEnabled: true,
        twoFactorSecret: secret,
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.disableTwoFactor(user, { password: 'wrong', code: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyTwoFactor', () => {
    it('should exchange 2fa token and valid TOTP code for auth tokens', async () => {
      const secret = authenticator.generateSecret();
      const code = authenticator.generate(secret);
      const user = {
        id: 'user-1',
        name: 'Test',
        username: 'test',
        email: 'test@example.com',
        role: ROLE.USER,
        isActive: true,
        isTwoFactorEnabled: true,
        twoFactorSecret: secret,
        password: 'hash',
      };
      const mockTokens = {
        accessToken: 'final.access.token',
        refreshToken: 'final.refresh.token',
        expiresIn: 3600,
      };

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        tokenType: '2fa_pending',
      });
      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue(
        user as any,
      );
      mockAuthService.generateAccessToken.mockReturnValue(mockTokens);
      mockUserService.updateRefreshToken.mockResolvedValue(undefined as any);

      const result = await service.verifyTwoFactor({
        twoFactorToken: 'valid.2fa.jwt',
        code,
      });

      expect(result).toEqual({
        user: {
          id: 'user-1',
          name: 'Test',
          username: 'test',
          email: 'test@example.com',
          role: ROLE.USER,
        },
        accessToken: 'final.access.token',
        refreshToken: 'final.refresh.token',
        expiresIn: 3600,
        requires2FA: false,
      });
    });

    it('should throw UnauthorizedException if pending 2fa token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.verifyTwoFactor({ twoFactorToken: 'invalid', code: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if TOTP code is incorrect', async () => {
      const secret = authenticator.generateSecret();
      const user = {
        id: 'user-1',
        isActive: true,
        isTwoFactorEnabled: true,
        twoFactorSecret: secret,
      };

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        tokenType: '2fa_pending',
      });
      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue(
        user as any,
      );

      await expect(
        service.verifyTwoFactor({ twoFactorToken: 'valid', code: '000000' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
