import { Test, TestingModule } from "@nestjs/testing";
import { EmailConfirmationService } from "../email-confirmation.service";
import { SendTokenUseCase } from "./send-token.use-case";
import { TokenGeneratorService } from "src/common/services/token-generator.service";

describe('SendTokenUseCase', () => {
    let useCase: SendTokenUseCase;
    let mockTokenGeneratorService: any;
    let mockEmailConfirmationService: any;
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

    it('should throw BadRequestException if adding to queue fails', async () => {
        mockTokenGeneratorService.generate.mockReturnValue('generated-token');
        mockEmailConfirmationService.saveToken.mockResolvedValue({ id: 'token-id' });
        mockEmailQueue.add.mockResolvedValue(null); // Simula falha
        
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
        });
        expect(result).toEqual({ statusCode: 200, status: true, message: 'Token sent successfully!' });
    });
});