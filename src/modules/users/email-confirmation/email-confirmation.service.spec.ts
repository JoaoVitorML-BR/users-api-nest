import { Test, TestingModule } from "@nestjs/testing";
import { EmailConfirmationService } from "./email-confirmation.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { EmailConfirmation } from "./email-confirmation.entity";
import { ROLE, User } from "../user.entity";

describe('EmailConfirmationService', () => {
    let service: EmailConfirmationService;
    let emailConfirmationRepository: {
        findOne: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
        remove: jest.Mock;
    };
    let userRepository: {
        findOne: jest.Mock;
        save: jest.Mock;
    };

    const createMockUser = (email: string): User => ({
        id: 'user-id',
        name: 'Test User',
        username: 'testuser',
        email,
        emailConfirmed: false,
        password: 'hashed-password',
        role: ROLE.USER,
        refreshToken: null,
        isActive: false,
        emailConfirmation: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    const createMockEmailConfirmation = (
        user: User,
        overrides: Partial<EmailConfirmation> = {},
    ): EmailConfirmation => ({
        id: 'email-confirmation-id',
        userId: user.id,
        user,
        token: 'test-token',
        expiresAt: new Date(),
        createdAt: new Date(),
        ...overrides,
    });

    beforeEach(async () => {
        const mockEmailConfirmationRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
        };

        const mockUserRepository = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmailConfirmationService,
                {
                    provide: getRepositoryToken(EmailConfirmation),
                    useValue: mockEmailConfirmationRepository,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
            ],
        }).compile();

        service = module.get<EmailConfirmationService>(EmailConfirmationService);
        emailConfirmationRepository = module.get(getRepositoryToken(EmailConfirmation));
        userRepository = module.get(getRepositoryToken(User));
    });

    it('should saveToken successfully', async () => {
        const email = 'test@example.com';
        const token = 'test-token';
        const user = createMockUser(email);
        const created = createMockEmailConfirmation(user, { token });

        userRepository.findOne.mockResolvedValue(user);
        emailConfirmationRepository.create.mockReturnValue(created);
        emailConfirmationRepository.save.mockResolvedValue(created);

        const result = await service.saveToken(email, token);

        expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email } });
        expect(emailConfirmationRepository.create).toHaveBeenCalled();
        expect(emailConfirmationRepository.save).toHaveBeenCalledWith(created);
        expect(result).toEqual(created);
    });

    it('should user not found if email does not exist', async () => {
        const email = 'nonexistent@example.com';
        userRepository.findOne.mockResolvedValue(null);

        await expect(service.saveToken(email, 'test-token')).rejects.toThrow(
            'Failed to save token: User not found for the provided email.'
        );
    });

    it('should return Failed to save token if there is an error', async () => {
        const email = 'test@example.com';
        const dbError = new Error('Database unavailable');
        const user = createMockUser(email);
        const created = createMockEmailConfirmation(user, { token: 'test-token' });

        userRepository.findOne.mockResolvedValue(user);
        emailConfirmationRepository.create.mockReturnValue(created);
        emailConfirmationRepository.save.mockRejectedValue(dbError);

        await expect(service.saveToken(email, 'test-token')).rejects.toThrow(
            `Failed to save token: ${dbError.message}`
        );
    });

    it('should activate account successfully', async () => {
        const token = 'valid-token';
        const user = createMockUser('test@example.com');
        const emailConfirmation = createMockEmailConfirmation(user, { token, expiresAt: new Date() });

        emailConfirmationRepository.findOne.mockResolvedValue(emailConfirmation);
        emailConfirmationRepository.remove.mockResolvedValue(emailConfirmation);
        userRepository.save.mockResolvedValue(user);

        const result = await service.activateAccount(token);

        expect(emailConfirmationRepository.findOne).toHaveBeenCalledWith({
            where: { token },
            relations: ['user'],
        });
        expect(emailConfirmationRepository.remove).toHaveBeenCalledWith(emailConfirmation);
        expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            emailConfirmed: true,
            isActive: true,
        }));
        expect(result).toEqual({
            statusCode: 200,
            status: true,
            message: 'Account activated successfully!',
        });
    });

    it('should return Token not found if email confirmation is not found', async () => {
        const token = 'invalid-token';
        emailConfirmationRepository.findOne.mockResolvedValue(null);

        await expect(service.activateAccount(token)).rejects.toThrow(
            'Token not found.'
        );
    });

    it('should return Token expiration date not set if expiresAt is not set', async () => {
        const token = 'token-without-expiration';
        const user = createMockUser('test@example.com');
        const emailConfirmation = createMockEmailConfirmation(user, { token });
        (emailConfirmation as any).expiresAt = undefined;

        emailConfirmationRepository.findOne.mockResolvedValue(emailConfirmation);

        await expect(service.activateAccount(token)).rejects.toThrow(
            'Token expiration date not set.'
        );
    });

    it('should return Token has expired if token is expired', async () => {
        const token = 'expired-token';
        const user = createMockUser('test@example.com');
        const emailConfirmation = createMockEmailConfirmation(user, { token, expiresAt: new Date(Date.now() - 1000) });

        emailConfirmationRepository.findOne.mockResolvedValue(emailConfirmation);
        emailConfirmationRepository.remove.mockResolvedValue(emailConfirmation);

        await expect(service.activateAccount(token)).rejects.toThrow(
            'Token has expired. Please request a new one.'
        );
        expect(emailConfirmationRepository.remove).toHaveBeenCalledWith(emailConfirmation);
    });
});