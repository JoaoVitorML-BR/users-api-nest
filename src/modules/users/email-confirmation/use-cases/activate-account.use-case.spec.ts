import { Test, TestingModule } from "@nestjs/testing";
import { EmailConfirmationService } from "../email-confirmation.service";
import { ActivateAccountUseCase } from "./activate-account.use-case";

describe('ActivateAccountUseCase', () => {
    let useCase: ActivateAccountUseCase;
    let emailConfirmationService: EmailConfirmationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: EmailConfirmationService,
                    useValue: {
                        activateAccount: jest.fn(),
                    },
                },
                ActivateAccountUseCase,
            ],
        }).compile();

        useCase = module.get<ActivateAccountUseCase>(ActivateAccountUseCase);
        emailConfirmationService = module.get<EmailConfirmationService>(EmailConfirmationService);
    });

    it('should throw BadRequestException if token is not provided', async () => {
        await expect(useCase.execute('')).rejects.toThrow('Token is required to activate the account.');
    });

    it('should call emailConfirmationService.activateAccount with the provided token', async () => {
        const token = 'valid-token';
        const activateAccountResult = { statusCode: 200, status: true, message: 'Account activated successfully' };
        jest.spyOn(emailConfirmationService, 'activateAccount').mockResolvedValue(activateAccountResult);
        const result = await useCase.execute(token);
        expect(emailConfirmationService.activateAccount).toHaveBeenCalledWith(token);
        expect(result).toBe(activateAccountResult);
    });
});