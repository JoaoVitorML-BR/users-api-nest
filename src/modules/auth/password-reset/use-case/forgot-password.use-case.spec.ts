import { TokenGeneratorService } from "src/common/services/token-generator.service";
import { PasswordResetService } from "../password-reset.service";
import { PasswordForgotUseCase } from "./forgot-password.use-case";
import { Test, TestingModule } from "@nestjs/testing";
import { getQueueToken } from "@nestjs/bull";

describe('PasswordForgotUseCase', () => {
    let passwordForgotUseCase: PasswordForgotUseCase;
    let passwordResetService: jest.Mocked<PasswordResetService>;
    let tokenGeneratorService: jest.Mocked<TokenGeneratorService>;
    let emailQueue: { add: jest.Mock };

    const mockPasswordResetService = {
        findUserByEmail: jest.fn(),
        removeOldTokens: jest.fn(),
        saveResetToken: jest.fn(),
        resetPassword: jest.fn(),
    };

    const mockTokenGeneratorService = {
        generate: jest.fn(),
    };

    const mockEmailQueue = {
        add: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PasswordForgotUseCase,
                {
                    provide: PasswordResetService,
                    useValue: mockPasswordResetService,
                },
                {
                    provide: TokenGeneratorService,
                    useValue: mockTokenGeneratorService,
                },
                {
                    provide: getQueueToken('email'),
                    useValue: mockEmailQueue,
                }
            ],
        }).compile();

        passwordForgotUseCase = module.get<PasswordForgotUseCase>(PasswordForgotUseCase);
        passwordResetService = module.get(PasswordResetService);
        tokenGeneratorService = module.get(TokenGeneratorService);
        emailQueue = module.get(getQueueToken('email'));
    });

    describe('forgotPassword', () => {
        it('should find user, generate token, save token and enqueue email', async () => {
            const email = 'user@example.com';
            const user = {
                id: 'user-id',
                email: 'user@example.com',
                username: 'user1',
                isActive: true,
            };
            const generatedToken = 'generated-token';

            passwordResetService.findUserByEmail.mockResolvedValue(user as any);
            passwordResetService.removeOldTokens.mockResolvedValue(undefined);
            tokenGeneratorService.generate.mockReturnValue(generatedToken);
            passwordResetService.saveResetToken.mockResolvedValue({} as any);
            emailQueue.add.mockResolvedValue(undefined);

            await passwordForgotUseCase.forgotPassword(email);

            expect(passwordResetService.findUserByEmail).toHaveBeenCalledWith(email);
            expect(passwordResetService.removeOldTokens).toHaveBeenCalledWith('user-id');
            expect(tokenGeneratorService.generate).toHaveBeenCalled();
            expect(passwordResetService.saveResetToken).toHaveBeenCalledWith('user-id', generatedToken);
            expect(emailQueue.add).toHaveBeenCalledWith({
                email: 'user@example.com',
                token: generatedToken,
                userName: 'user1',
                type: 'password-reset',
            });
        });
    });
});