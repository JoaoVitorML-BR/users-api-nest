import { Test, TestingModule } from "@nestjs/testing";
import { EmailConfirmationTokenController } from "./email-confirmation.controller";
import { ActivateAccountUseCase } from "./use-cases/activate-account.use-case";
import { SendTokenUseCase } from "./use-cases/send-token.use-case";

describe('EmailConfirmationController', () => {
    let controller: EmailConfirmationTokenController;
    let activateAccountUseCase: ActivateAccountUseCase;
    let sendTokenUseCase: SendTokenUseCase;

    const mockActivateAccountUseCase = {
        execute: jest.fn(),
    }

    const mockSendTokenUseCase = {
        execute: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [EmailConfirmationTokenController],
            providers: [
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
        sendTokenUseCase = module.get<SendTokenUseCase>(SendTokenUseCase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('ActivateAccount', () => {
        it('should activate account with valid token', async () => {
            mockActivateAccountUseCase.execute.mockResolvedValue(undefined);

            const result = await controller.ActivateAccount({ token: 'valid-token' });

            expect(activateAccountUseCase.execute).toHaveBeenCalledWith('valid-token');
            expect(result).toEqual({
                statusCode: 200,
                status: true,
                code: 'SUCCESS',
                message: 'Account activated successfully',
                data: null,
            });
        });
    });

    describe('sendEmail', () => {
        it('should call send token use case and return success response', async () => {
            mockSendTokenUseCase.execute.mockResolvedValue(undefined);

            const dto = { email: 'test@example.com' };
            const result = await controller.sendEmail(dto);

            expect(sendTokenUseCase.execute).toHaveBeenCalledWith({ email: dto.email });
            expect(result).toEqual({
                statusCode: 200,
                status: true,
                code: 'SUCCESS',
                message: 'Email sent successfully',
                data: null,
            });
        });
    });
});