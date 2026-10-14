import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetUseCase } from './use-case/reset-password.use-case';
import { PasswordForgotUseCase } from './use-case/forgot-password.use-case';
import { PasswordResetService } from './password-reset.service';

describe('PasswordResetController', () => {
  let controller: PasswordResetController;

  const mockPasswordForgotUseCase = {
    forgotPassword: jest.fn(),
  };

  const mockResetPasswordUseCase = {
    resetPassword: jest.fn(),
  };

  const mockPasswordResetService = {
    validateResetToken: jest.fn(),
  };

  const mockResponseForgotPassword = {
    statusCode: 200,
    code: 'SUCCESS',
    status: true,
    message:
      'If the email exists in our system, a password reset token has been sent.',
  };

  const mockResponseResetPassword = {
    statusCode: 200,
    code: 'SUCCESS',
    status: true,
    message: 'Password reset successfully.',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PasswordResetController],
      providers: [
        {
          provide: PasswordForgotUseCase,
          useValue: mockPasswordForgotUseCase,
        },
        {
          provide: PasswordResetUseCase,
          useValue: mockResetPasswordUseCase,
        },
        {
          provide: PasswordResetService,
          useValue: mockPasswordResetService,
        },
      ],
    }).compile();

    controller = module.get<PasswordResetController>(PasswordResetController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('validateToken', () => {
    it('should validate token and return success response', async () => {
      mockPasswordResetService.validateResetToken.mockResolvedValue(true);

      const result = await controller.validateToken({ token: 'valid-token' });

      expect(mockPasswordResetService.validateResetToken).toHaveBeenCalledWith(
        'valid-token',
      );
      expect(result).toEqual({
        statusCode: 200,
        code: 'SUCCESS',
        status: true,
        message: 'Token is valid.',
      });
    });

    it('should throw BadRequestException when token is invalid', async () => {
      mockPasswordResetService.validateResetToken.mockRejectedValue(
        new BadRequestException('Invalid or expired token'),
      );

      await expect(
        controller.validateToken({ token: 'invalid-token' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('should call forgotPassword use case and return success response', async () => {
      const email = 'user@example.com';

      mockPasswordForgotUseCase.forgotPassword.mockResolvedValue(undefined);

      const result = await controller.forgotPassword({ email });

      expect(mockPasswordForgotUseCase.forgotPassword).toHaveBeenCalledWith(
        email,
      );
      expect(result).toEqual(mockResponseForgotPassword);
    });
  });

  describe('resetPasswordWithToken', () => {
    it('should call resetPassword use case and return success response', async () => {
      const resetPasswordDto = {
        token: 'reset-token',
        newPassword: 'NewPass@123',
        confirmNewPassword: 'NewPass@123',
      };

      mockResetPasswordUseCase.resetPassword.mockResolvedValue(undefined);

      const result = await controller.resetPasswordWithToken(resetPasswordDto);

      expect(mockResetPasswordUseCase.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto,
      );
      expect(result).toEqual(mockResponseResetPassword);
    });

    it('should throw BadRequestException if newPassword and confirmNewPassword do not match', async () => {
      const resetPasswordDto = {
        token: 'reset-token',
        newPassword: 'NewPass@123',
        confirmNewPassword: 'DifferentPass@123',
      };

      mockResetPasswordUseCase.resetPassword.mockRejectedValue(
        new BadRequestException(
          'New password and confirm new password do not match',
        ),
      );

      await expect(
        controller.resetPasswordWithToken(resetPasswordDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if token is invalid or expired', async () => {
      const resetPasswordDto = {
        token: 'invalid-token',
        newPassword: 'NewPass@123',
        confirmNewPassword: 'NewPass@123',
      };

      mockResetPasswordUseCase.resetPassword.mockRejectedValue(
        new BadRequestException('Invalid or expired reset token'),
      );

      await expect(
        controller.resetPasswordWithToken(resetPasswordDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
