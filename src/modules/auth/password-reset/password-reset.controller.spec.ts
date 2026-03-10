import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PasswordResetController } from "./password-reset.controller";
import { PassworResetdUseCase } from "./use-case/reset-password.use-case";
import { PasswordForgotUseCase } from "./use-case/forgot-password.use-case";

describe('PasswordResetController', () => {
    let controller: PasswordResetController;
    let passwordForgotUseCase: jest.Mocked<PasswordForgotUseCase>;
    let resetPasswordUseCase: jest.Mocked<PassworResetdUseCase>;

    const mockPasswordForgotUseCase = {
        forgotPassword: jest.fn(),
    };

    const mockResetPasswordUseCase = {
        resetPassword: jest.fn(),
    };

    const mockResponseForgotPassword = {
        statusCode: 200,
        code: 'SUCCESS',
        status: true,
        message: 'If the email exists in our system, a password reset token has been sent.',
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
                    provide: PassworResetdUseCase,
                    useValue: mockResetPasswordUseCase,
                },
            ],
        }).compile();

        controller = module.get<PasswordResetController>(PasswordResetController);
        passwordForgotUseCase = module.get(PasswordForgotUseCase);
        resetPasswordUseCase = module.get(PassworResetdUseCase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('forgotPassword', () => {
        it('should call forgotPassword use case and return success response', async () => {
            const email = 'user@example.com';

            passwordForgotUseCase.forgotPassword.mockResolvedValue(undefined);

            const result = await controller.forgotPassword({ email });

            expect(passwordForgotUseCase.forgotPassword).toHaveBeenCalledWith(email);
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

            resetPasswordUseCase.resetPassword.mockResolvedValue(undefined);

            const result = await controller.resetPasswordWithToken(resetPasswordDto);

            expect(resetPasswordUseCase.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
            expect(result).toEqual(mockResponseResetPassword);
        });

        it('should throw BadRequestException if newPassword and confirmNewPassword do not match', async () => {
            const resetPasswordDto = {
                token: 'reset-token',
                newPassword: 'NewPass@123',
                confirmNewPassword: 'DifferentPass@123',
            };

            resetPasswordUseCase.resetPassword.mockRejectedValue(
                new BadRequestException('New password and confirm new password do not match'),
            );

            await expect(controller.resetPasswordWithToken(resetPasswordDto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if token is invalid or expired', async () => {
            const resetPasswordDto = {
                token: 'invalid-token',
                newPassword: 'NewPass@123',
                confirmNewPassword: 'NewPass@123',
            };

            resetPasswordUseCase.resetPassword.mockRejectedValue(
                new BadRequestException('Invalid or expired reset token'),
            );

            await expect(controller.resetPasswordWithToken(resetPasswordDto)).rejects.toThrow(BadRequestException);
        });
    });
});
