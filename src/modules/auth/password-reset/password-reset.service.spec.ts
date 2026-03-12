import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { PasswordResetService } from "./password-reset.service";
import { ResetPasswordToken } from "./password-reset.entity";
import { UserService } from "src/modules/users/user.service";

describe('PasswordResetService', () => {
    let service: PasswordResetService;
    let resetTokenRepository: {
        create: jest.Mock;
        save: jest.Mock;
        delete: jest.Mock;
        findOne: jest.Mock;
        remove: jest.Mock;
    };
    let userService: jest.Mocked<UserService>;

    const mockResetTokenRepository = {
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
    };

    const mockUserService = {
        findByEmail: jest.fn(),
        updatePassword: jest.fn(),
        updateRefreshToken: jest.fn(),
    } as Partial<jest.Mocked<UserService>>;

    const mockConfigService = {
        get: jest.fn().mockReturnValue(15),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PasswordResetService,
                {
                    provide: getRepositoryToken(ResetPasswordToken),
                    useValue: mockResetTokenRepository,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                }
            ],
        }).compile();
        service = module.get<PasswordResetService>(PasswordResetService);
        resetTokenRepository = module.get(getRepositoryToken(ResetPasswordToken));
        userService = module.get(UserService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findUserByEmail', () => {
        it('should call UserService.findByEmail with email', async () => {
            const email = 'user@example.com';
            const user = { id: 'user-id', email };

            userService.findByEmail.mockResolvedValue(user as any);

            const result = await service.findUserByEmail(email);

            expect(userService.findByEmail).toHaveBeenCalledWith(email);
            expect(result).toEqual(user);
        });
    });

    describe('saveResetToken', () => {
        it('should create and save a reset token', async () => {
            const userId = 'user-id';
            const token = 'reset-token';
            const now = new Date('2026-03-12T15:50:09.726Z').getTime();
            const expiresAt = new Date(now + 15 * 60 * 1000);
            const resetTokenEntity = { userId, token, expiresAt };

            jest.spyOn(Date, 'now').mockReturnValue(now);

            resetTokenRepository.create.mockReturnValue(resetTokenEntity);
            resetTokenRepository.save.mockResolvedValue(resetTokenEntity);

            await service.saveResetToken(userId, token);

            expect(resetTokenRepository.create).toHaveBeenCalledWith({ userId, token, expiresAt });
            expect(resetTokenRepository.save).toHaveBeenCalledWith(resetTokenEntity);
        });
    });

    describe('removeOldTokens', () => {
        it('should delete old tokens for a user', async () => {
            const userId = 'user-id';
            resetTokenRepository.delete.mockResolvedValue({ affected: 1 });

            await service.removeOldTokens(userId);

        });
    });

    describe('resetPassword', () => {
        it('should update password, clear refresh token and consume token when token is valid', async () => {
            const token = 'reset-token';
            const newPassword = 'hashed-password';
            const validToken = {
                id: 'token-id',
                userId: 'user-id',
                token,
                expiresAt: new Date(Date.now() + 60_000),
            };

            resetTokenRepository.findOne.mockResolvedValue(validToken);
            userService.updatePassword.mockResolvedValue(true as any);
            userService.updateRefreshToken.mockResolvedValue({} as any);
            resetTokenRepository.delete.mockResolvedValue({ affected: 1 });

            await service.resetPassword(token, newPassword);

            expect(userService.updatePassword).toHaveBeenCalledWith('user-id', newPassword);
            expect(userService.updateRefreshToken).toHaveBeenCalledWith('user-id', null);
            expect(resetTokenRepository.delete).toHaveBeenCalledWith({ token });
        });

        it('should throw BadRequestException when token is invalid', async () => {
            resetTokenRepository.findOne.mockResolvedValue(null);

            await expect(service.resetPassword('invalid-token', 'hashed-password')).rejects.toThrow(BadRequestException);
        });
    });
});
