import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PasswordResetService } from "../password-reset.service";
import * as bcrypt from 'bcrypt';
import { PassworResetdUseCase } from "./reset-password.use-case";

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
}));

describe('PasswordResetUseCase', () => {
    let resetPasswordUseCase: PassworResetdUseCase;
    let passwordResetService: jest.Mocked<PasswordResetService>;

    const mockPasswordResetService = {
        resetPassword: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PassworResetdUseCase,
                {
                    provide: PasswordResetService,
                    useValue: mockPasswordResetService,
                }
            ],
        }).compile();

        resetPasswordUseCase = module.get<PassworResetdUseCase>(PassworResetdUseCase);
        passwordResetService = module.get(PasswordResetService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(resetPasswordUseCase).toBeDefined();
    });

    describe('resetPassword', () => {
        it('should reset password successfully', async () => {
            const dto = {
                token: 'reset-token',
                newPassword: 'NewPass@123',
                confirmNewPassword: 'NewPass@123',
            };
            const passwordEncrypted = 'hashed-password';

            (bcrypt.hash as jest.Mock).mockResolvedValue(passwordEncrypted);
            passwordResetService.resetPassword.mockResolvedValue(undefined);

            await resetPasswordUseCase.resetPassword(dto);

            expect(bcrypt.hash).toHaveBeenCalledWith(dto.newPassword, 10);
            expect(passwordResetService.resetPassword).toHaveBeenCalledWith(dto.token, passwordEncrypted);
        });

        it('should throw BadRequestException when passwords do not match', async () => {
            const dto = {
                token: 'reset-token',
                newPassword: 'NewPass@123',
                confirmNewPassword: 'DifferentPass@123',
            };

            await expect(resetPasswordUseCase.resetPassword(dto)).rejects.toThrow(BadRequestException);
            expect(passwordResetService.resetPassword).not.toHaveBeenCalled();
        });
    });

});