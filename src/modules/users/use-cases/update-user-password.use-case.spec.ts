import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { authenticator } from 'otplib';
import { UserService } from '../user.service';
import { UpdatePasswordUseCase } from './update-user-password.use-case';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UpdatePasswordUseCase', () => {
  let updatePasswordUseCase: UpdatePasswordUseCase;
  let userService: UserService;

  const mockUserService = {
    findById: jest.fn(),
    findByIdWithPassword: jest.fn(),
    findByIdWithTwoFactorSecret: jest.fn(),
    updatePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePasswordUseCase,
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    updatePasswordUseCase = module.get<UpdatePasswordUseCase>(
      UpdatePasswordUseCase,
    );
    userService = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(updatePasswordUseCase).toBeDefined();
  });

  describe('updatePassword', () => {
    const baseUser = {
      id: '1',
      name: 'John Doe',
      username: 'john123',
      email: 'john.doe@example.com',
      password: '$2b$10$hashedpassword123',
      role: 'USER',
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
    };

    it('should update password successfully (2FA disabled)', async () => {
      const updateData = {
        currentPassword: 'currentpassword',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!',
      };
      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(
        '$2b$10$newhashedpassword123',
      );
      mockUserService.updatePassword.mockResolvedValue(true);

      const result = await updatePasswordUseCase.updatePassword(
        updateData,
        '1',
        '1',
      );

      expect(userService.findByIdWithTwoFactorSecret).toHaveBeenCalledWith('1');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'currentpassword',
        baseUser.password,
      );
      expect(userService.updatePassword).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should update password successfully (2FA enabled, valid code)', async () => {
      const secret = authenticator.generateSecret();
      const validCode = authenticator.generate(secret);
      const userWith2FA = {
        ...baseUser,
        isTwoFactorEnabled: true,
        twoFactorSecret: secret,
      };
      const updateData = {
        currentPassword: 'currentpassword',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!',
        twoFactorCode: validCode,
      };
      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue(
        userWith2FA,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(
        '$2b$10$newhashedpassword123',
      );
      mockUserService.updatePassword.mockResolvedValue(true);

      const result = await updatePasswordUseCase.updatePassword(
        updateData,
        '1',
        '1',
      );

      expect(result).toBe(true);
      expect(userService.updatePassword).toHaveBeenCalled();
    });

    it('should throw BadRequestException when 2FA enabled but code not provided', async () => {
      const userWith2FA = {
        ...baseUser,
        isTwoFactorEnabled: true,
        twoFactorSecret: 'some-secret',
      };
      const updateData = {
        currentPassword: 'currentpassword',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!',
      };
      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue(
        userWith2FA,
      );

      await expect(
        updatePasswordUseCase.updatePassword(updateData, '1', '1'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        updatePasswordUseCase.updatePassword(updateData, '1', '1'),
      ).rejects.toThrow('Two-factor authentication code is required');
    });

    it('should throw BadRequestException when 2FA enabled but code is invalid', async () => {
      const secret = authenticator.generateSecret();
      const userWith2FA = {
        ...baseUser,
        isTwoFactorEnabled: true,
        twoFactorSecret: secret,
      };
      const updateData = {
        currentPassword: 'currentpassword',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!',
        twoFactorCode: '000000',
      };
      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue(
        userWith2FA,
      );

      await expect(
        updatePasswordUseCase.updatePassword(updateData, '1', '1'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        updatePasswordUseCase.updatePassword(updateData, '1', '1'),
      ).rejects.toThrow('Invalid two-factor authentication code');
    });

    it('should throw BadRequestException when 2FA enabled but secret is missing', async () => {
      const userWith2FA = {
        ...baseUser,
        isTwoFactorEnabled: true,
        twoFactorSecret: null,
      };
      const updateData = {
        currentPassword: 'currentpassword',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!',
        twoFactorCode: '123456',
      };
      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue(
        userWith2FA,
      );

      await expect(
        updatePasswordUseCase.updatePassword(updateData, '1', '1'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        updatePasswordUseCase.updatePassword(updateData, '1', '1'),
      ).rejects.toThrow(
        'Two-factor authentication is misconfigured. Please contact support.',
      );
    });

    it('should throw ForbiddenException when user tries to change another user password', async () => {
      const updateData = {
        currentPassword: 'currentpassword',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!',
      };

      await expect(
        updatePasswordUseCase.updatePassword(updateData, '1', 'other-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for incorrect current password', async () => {
      const updateData = {
        currentPassword: 'wrongpassword',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!',
      };
      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        updatePasswordUseCase.updatePassword(updateData, '1', '1'),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw BadRequestException for non-matching new passwords', async () => {
      const updateData = {
        currentPassword: 'currentpassword',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'DifferentNewPassword123!',
      };
      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        updatePasswordUseCase.updatePassword(updateData, '1', '1'),
      ).rejects.toThrow('Passwords do not match');
    });

    it('should throw NotFoundException for user not found', async () => {
      const updateData = {
        currentPassword: 'currentpassword',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!',
      };
      mockUserService.findByIdWithTwoFactorSecret.mockResolvedValue(null);

      await expect(
        updatePasswordUseCase.updatePassword(updateData, '1', '1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
