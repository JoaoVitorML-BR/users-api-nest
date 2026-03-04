import { Test, TestingModule } from "@nestjs/testing";
import { EmailConfirmationService } from "../email-confirmation.service";
import { SendTokenUseCase } from "./send-token.use-case";
import { TokenGeneratorService } from "src/common/services/token-generator.service";
import { SendTokenFromEmailService } from "src/common/services/send-email-token.service";

describe('SendTokenUseCase', () => {
    let useCase: SendTokenUseCase;
    let emailConfirmationService: EmailConfirmationService;
    let sendTokenFromEmailService: SendTokenFromEmailService;

    const mockTokenGeneratorService = {
        generate: jest.fn(),
    };

    const mockSendTokenFromEmailService = {
        sendToken: jest.fn(),
    };

    const mockEmailConfirmationService = {
        saveToken: jest.fn(),
    };

    const mockEmailQueue = {
        add: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: TokenGeneratorService,
                    useValue: mockTokenGeneratorService,
                },
                {
                    provide: SendTokenFromEmailService,
                    useValue: mockSendTokenFromEmailService,
                },
                {
                    provide: EmailConfirmationService,
                    useValue: mockEmailConfirmationService,
                },
                {
                    provide: 'BullQueue_email',
                    useValue: mockEmailQueue,
                },
                SendTokenUseCase,
            ],
        }).compile();

        useCase = module.get<SendTokenUseCase>(SendTokenUseCase);
        emailConfirmationService = module.get<EmailConfirmationService>(EmailConfirmationService);
        sendTokenFromEmailService = module.get<SendTokenFromEmailService>(SendTokenFromEmailService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should throw BadRequestException if token generation fails', async () => {
        jest.spyOn(useCase['tokenGeneratorService'], 'generate').mockReturnValue("");
        await expect(useCase.execute({ email: "test@example.com" })).rejects.toThrow('Failed to generate token.');
    });

    it('should throw BadRequestException if email is not provided', async () => {
        jest.spyOn(useCase['tokenGeneratorService'], 'generate').mockReturnValue('generated-token');
        await expect(useCase.execute({} as any)).rejects.toThrow('Email is required to send the token.');
    });

    it('should throw BadRequestException if saving token fails', async () => {
        jest.spyOn(useCase['tokenGeneratorService'], 'generate').mockReturnValue('generated-token');
        jest.spyOn(emailConfirmationService, 'saveToken').mockResolvedValue(undefined as any);
        await expect(useCase.execute({ email: "test@example.com" })).rejects.toThrow('Failed to save token.');
    });

    it('should throw BadRequestException if sending email fails', async () => {
        jest.spyOn(useCase['tokenGeneratorService'], 'generate').mockReturnValue('generated-token');
        jest.spyOn(emailConfirmationService, 'saveToken').mockResolvedValue({} as any);
        jest.spyOn(sendTokenFromEmailService, 'sendToken').mockResolvedValue(false);
        await expect(useCase.execute({ email: "test@example.com" })).rejects.toThrow('Failed to send email with the token.');
    });

    it('should call dependencies and return success when email is provided', async () => {
        jest.spyOn(useCase['tokenGeneratorService'], 'generate').mockReturnValue('generated-token');
        jest.spyOn(emailConfirmationService, 'saveToken').mockResolvedValue({} as any);
        jest.spyOn(sendTokenFromEmailService, 'sendToken').mockResolvedValue(true);

        const dto = { email: "test@example.com" };
        const result = await useCase.execute(dto);

        expect(emailConfirmationService.saveToken).toHaveBeenCalledWith(dto.email, 'generated-token');
        expect(sendTokenFromEmailService.sendToken).toHaveBeenCalledWith(dto.email, 'generated-token');
        expect(result).toEqual({ statusCode: 200, status: true, message: 'Token sent successfully!' });
    });
});