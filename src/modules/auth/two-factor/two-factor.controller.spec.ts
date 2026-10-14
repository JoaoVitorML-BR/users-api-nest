import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorController } from './two-factor.controller';
import { TwoFactorService } from './two-factor.service';
import { JwtGuard } from '../guards/jwt.guard';
import { Request } from 'express';
import { AuthenticatedUser } from '../types/auth.types';

type AuthReq = Request & { user: AuthenticatedUser };

describe('TwoFactorController', () => {
  let controller: TwoFactorController;

  const mockTwoFactorService = {
    generateSecret: jest.fn(),
    enableTwoFactor: jest.fn(),
    disableTwoFactor: jest.fn(),
    verifyTwoFactor: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwoFactorController],
      providers: [
        {
          provide: TwoFactorService,
          useValue: mockTwoFactorService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TwoFactorController>(TwoFactorController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generate', () => {
    it('should call service and return generated 2FA secret and QR code', async () => {
      const req = {
        user: { id: 'user-1', email: 'test@example.com' },
      } as unknown as AuthReq;
      const mockData = {
        secret: 'SECRET123',
        qrCodeDataUrl: 'data:image/png;base64,...',
        otpAuthUrl: 'otpauth://...',
      };
      mockTwoFactorService.generateSecret.mockResolvedValue(mockData);

      const result = await controller.generate(req);

      expect(mockTwoFactorService.generateSecret).toHaveBeenCalledWith(
        req.user,
      );
      expect(result).toEqual({
        statusCode: 200,
        status: true,
        code: 'SUCCESS',
        message: '2FA secret generated successfully',
        data: mockData,
      });
    });
  });

  describe('enable', () => {
    it('should enable 2FA and return success message', async () => {
      const req = { user: { id: 'user-1' } } as unknown as AuthReq;
      const dto = { secret: 'SECRET123', code: '123456' };

      mockTwoFactorService.enableTwoFactor.mockResolvedValue(undefined);

      const result = await controller.enable(req, dto);

      expect(mockTwoFactorService.enableTwoFactor).toHaveBeenCalledWith(
        req.user,
        dto,
      );
      expect(result).toEqual({
        statusCode: 200,
        status: true,
        code: 'SUCCESS',
        message: 'Two factor authentication enabled successfully',
        data: null,
      });
    });
  });

  describe('disable', () => {
    it('should disable 2FA and return success message', async () => {
      const req = { user: { id: 'user-1' } } as unknown as AuthReq;
      const dto = { password: 'Password@123', code: '123456' };

      mockTwoFactorService.disableTwoFactor.mockResolvedValue(undefined);

      const result = await controller.disable(req, dto);

      expect(mockTwoFactorService.disableTwoFactor).toHaveBeenCalledWith(
        req.user,
        dto,
      );
      expect(result).toEqual({
        statusCode: 200,
        status: true,
        code: 'SUCCESS',
        message: 'Two factor authentication disabled successfully',
        data: null,
      });
    });
  });

  describe('verify', () => {
    it('should verify 2FA token and code and return login response', async () => {
      const dto = { twoFactorToken: 'pending.jwt', code: '123456' };
      const mockLoginData = {
        user: {
          id: 'user-1',
          name: 'Test',
          username: 'test',
          email: 'test@example.com',
          role: 'user',
        },
        accessToken: 'final.access.token',
        refreshToken: 'final.refresh.token',
        expiresIn: 3600,
        requires2FA: false,
      };

      mockTwoFactorService.verifyTwoFactor.mockResolvedValue(mockLoginData);

      const result = await controller.verify(dto);

      expect(mockTwoFactorService.verifyTwoFactor).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        statusCode: 200,
        status: true,
        code: 'SUCCESS',
        message: 'Two factor verification successful',
        data: mockLoginData,
      });
    });
  });
});
