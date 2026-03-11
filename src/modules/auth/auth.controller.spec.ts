import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from "./auth.controller";
import { AuthSignInUseCase } from "./use-cases/auth-login.use-case";
import { PassworResetdUseCase } from './password-reset/use-case/reset-password.use-case';

describe('AuthController', () => {
    let controller: AuthController;

    const mockAuthUseCase = {
        signIn: jest.fn(),
        refreshToken: jest.fn(),
        logout: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthSignInUseCase,
                    useValue: mockAuthUseCase,
                },
                {
                    provide: PassworResetdUseCase,
                    useValue: mockAuthUseCase
                }
            ],
        }).compile();
        controller = module.get<AuthController>(AuthController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('signIn', () => {
        it('should return user data on successful login', async () => {
            const signInDto = { login: 'testuser', password: 'password123' };
            const mockLoginData = {
                user: {
                    id: '123',
                    username: 'testuser',
                    email: 'testuser@example.com',
                    name: 'Test User',
                    role: 'USER',
                },
                accessToken: 'mock.access.token',
                refreshToken: 'mock.refresh.token',
                expiresIn: 3600,
            };
            mockAuthUseCase.signIn.mockResolvedValue(mockLoginData);

            const result = await controller.signIn(signInDto);

            expect(mockAuthUseCase.signIn).toHaveBeenCalledWith(signInDto);
            expect(result).toEqual({
                statusCode: 200,
                status: true,
                code: 'SUCCESS',
                message: 'Login successful',
                data: mockLoginData,
            });
            expect(result.data).toHaveProperty('accessToken');
            expect(result.data).toHaveProperty('refreshToken');
            expect(result.data).toHaveProperty('user');
        });
    });

    describe('refreshToken', () => {
        it('should return new tokens on successful refresh', async () => {
            const refreshDto = { refreshToken: 'mock.refresh.token' };
            const mockRefreshData = {
                accessToken: 'new.access.token',
                refreshToken: 'new.refresh.token',
                expiresIn: 3600,
            };

            mockAuthUseCase.refreshToken.mockResolvedValue(mockRefreshData);

            const result = await controller.refreshToken(refreshDto);

            expect(mockAuthUseCase.refreshToken).toHaveBeenCalledWith(refreshDto);
            expect(result).toEqual({
                statusCode: 200,
                status: true,
                code: 'SUCCESS',
                message: 'Token refreshed successfully',
                data: mockRefreshData,
            });
            expect(result.data).toHaveProperty('accessToken');
            expect(result.data).toHaveProperty('refreshToken');
        });
    });

    describe('logout', () => {
        it('should return success message on logout', async () => {
            const mockReq = {
                user: {
                    id: '123',
                    username: 'testuser',
                    email: 'testuser@example.com',
                    name: 'Test User',
                    role: 'USER',
                }
            } as any;

            mockAuthUseCase.logout.mockResolvedValue(undefined);

            const result = await controller.logout(mockReq);

            expect(mockAuthUseCase.logout).toHaveBeenCalledWith(mockReq.user);
            expect(result).toEqual({
                statusCode: 200,
                status: true,
                code: 'SUCCESS',
                message: 'Logout successful',
                data: null,
            });
        });
    });
});