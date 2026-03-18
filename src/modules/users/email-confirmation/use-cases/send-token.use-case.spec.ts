import { Test, TestingModule } from "@nestjs/testing";
import { EmailConfirmationService } from "../email-confirmation.service";
import { SendTokenUseCase } from "./send-token.use-case";
import { TokenGeneratorService } from "src/common/services/token-generator.service";
import { SendTokenFromEmailService } from "src/common/services/send-email-token.service";

describe('SendTokenUseCase', () => {
    let useCase: SendTokenUseCase;
    let mockTokenGeneratorService: any;
    let mockEmailConfirmationService: any;
    let mockSendTokenFromEmailService: any;
    let mockEmailQueue: any;

    beforeEach(async () => {
        mockTokenGeneratorService = {
            generate: jest.fn(),
        };

        mockEmailConfirmationService = {
            saveToken: jest.fn(),
        };

        mockEmailQueue = {
            add: jest.fn().mockResolvedValue({ id: 'job-id' }),
        };

        mockSendTokenFromEmailService = {
            sendToken: jest.fn().mockResolvedValue(true),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: TokenGeneratorService,
                    useValue: mockTokenGeneratorService,
                },
                {
                    provide: EmailConfirmationService,
                    useValue: mockEmailConfirmationService,
                },
                {
                    provide: 'BullQueue_email',
                    useValue: mockEmailQueue,
                },
                {
                    provide: SendTokenFromEmailService,
                    useValue: mockSendTokenFromEmailService,
                },
                SendTokenUseCase,
            ],
        }).compile();

        useCase = module.get<SendTokenUseCase>(SendTokenUseCase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should throw BadRequestException if token generation fails', async () => {
        mockTokenGeneratorService.generate.mockReturnValue("");
        await expect(useCase.execute({ email: "test@example.com" })).rejects.toThrow('Failed to generate token.');
    });

    it('should throw BadRequestException if email is not provided', async () => {
        mockTokenGeneratorService.generate.mockReturnValue('generated-token');
        await expect(useCase.execute({} as any)).rejects.toThrow('Email is required to send the token.');
    });

    it('should throw BadRequestException if saving token fails', async () => {
        mockTokenGeneratorService.generate.mockReturnValue('generated-token');
        mockEmailConfirmationService.saveToken.mockResolvedValue(undefined);
        await expect(useCase.execute({ email: "test@example.com" })).rejects.toThrow('Failed to save token.');
    });

    it('should fallback to direct email when queue fails', async () => {
        mockTokenGeneratorService.generate.mockReturnValue('generated-token');
        mockEmailConfirmationService.saveToken.mockResolvedValue({ id: 'token-id' });
        mockEmailQueue.add.mockRejectedValue(new Error('queue down'));
        mockSendTokenFromEmailService.sendToken.mockResolvedValue(true);
        const dto = { email: "test@example.com" };
        
        await expect(useCase.execute(dto)).resolves.toBeUndefined();

        expect(mockSendTokenFromEmailService.sendToken).toHaveBeenCalledWith(
            dto.email,
            'generated-token',
            'email-confirmation'
        );
    });

    it('should throw BadRequestException if queue fails and fallback also fails', async () => {
        mockTokenGeneratorService.generate.mockReturnValue('generated-token');
        mockEmailConfirmationService.saveToken.mockResolvedValue({ id: 'token-id' });
        mockEmailQueue.add.mockRejectedValue(new Error('queue down'));
        mockSendTokenFromEmailService.sendToken.mockResolvedValue(false);

        await expect(useCase.execute({ email: "test@example.com" })).rejects.toThrow('Failed to send email with the token.');
    });

    it('should call dependencies and return success when email is provided', async () => {
        mockTokenGeneratorService.generate.mockReturnValue('generated-token');
        mockEmailConfirmationService.saveToken.mockResolvedValue({ id: 'token-id' });
        mockEmailQueue.add.mockResolvedValue({ id: 'job-id' }); // Job válido

        const dto = { email: "test@example.com" };
        const result = await useCase.execute(dto);

        expect(mockTokenGeneratorService.generate).toHaveBeenCalled();
        expect(mockEmailConfirmationService.saveToken).toHaveBeenCalledWith(dto.email, 'generated-token');
        expect(mockEmailQueue.add).toHaveBeenCalledWith({
            email: dto.email,
            token: 'generated-token'
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
        });
        expect(result).toBeUndefined();
    });
});