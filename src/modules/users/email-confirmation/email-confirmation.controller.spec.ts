import { Test, TestingModule } from "@nestjs/testing";
import { EmailConfirmationTokenController } from "./email-confirmation.controller";
import { ActivateAccountUseCase } from "./use-cases/activate-account.use-case";
import { SendTokenUseCase } from "./use-cases/send-token.use-case";
import { getQueueToken } from '@nestjs/bull';

describe('EmailConfirmationController', () => {
    let controller: EmailConfirmationTokenController;
    let activateAccountUseCase: ActivateAccountUseCase;
    let sendTokenFromEmailUseCase: SendTokenUseCase;

    const mockActivateAccountUseCase = {
        execute: jest.fn(),
    }

    const mockSendTokenUseCase = {
        execute: jest.fn(),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [EmailConfirmationTokenController],
            providers: [
                {
                    provide: getQueueToken('email'),
                    useValue: { add: jest.fn() },
                },
                {
                    provide: ActivateAccountUseCase,
                    useValue: mockActivateAccountUseCase
                },
                {
                    provide: SendTokenUseCase,
                    useValue: mockSendTokenUseCase
                },
            ],
        }).compile();

        controller = module.get<EmailConfirmationTokenController>(EmailConfirmationTokenController);
        activateAccountUseCase = module.get<ActivateAccountUseCase>(ActivateAccountUseCase);
        sendTokenFromEmailUseCase = module.get<SendTokenUseCase>(SendTokenUseCase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('ActivateAccount', () => {
        it('should activate account with valid token', async () => {
            const mockResponse = {
                statusCode: 200,
                message: 'Account activated successfully'
            };

            mockActivateAccountUseCase.execute.mockResolvedValue(mockResponse);

            const result = await controller.ActivateAccount({ token: 'valid-token' });

            expect(activateAccountUseCase.execute).toHaveBeenCalledWith('valid-token');
            expect(result).toEqual(mockResponse);
        });

        it('should return error for invalid token', async () => {
            const mockError = {
                statusCode: 400,
                message: 'Invalid token'
            };

            mockActivateAccountUseCase.execute.mockResolvedValue(mockError);

            const result = await controller.ActivateAccount({ token: 'invalid-token' });

            expect(activateAccountUseCase.execute).toHaveBeenCalledWith('invalid-token');
            expect(result).toEqual(mockError);
        });
    });

    describe('sendEmail', () => {
        it('should add job to queue', async () => {
            const mockResponse = {
                statusCode: 200,
                status: true,
                code: "SUCCESS",
                message: "Email sent successfully",
            };

            const emailQueue = (controller as any).emailQueue;
            emailQueue.add.mockResolvedValue(undefined);

            const dto = { email: 'test@example.com', token: 'token-generated' };
            const result = await controller.sendEmail(dto);

            expect(emailQueue.add).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mockResponse);
        });
    });
});