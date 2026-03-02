import { Test, TestingModule } from '@nestjs/testing';
import { AuthSignInUseCase } from './auth-login.use-case';
import { UserService } from '../../users/user.service';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { SignInDto } from '../dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthSignInUseCase', () => {
    let useCase: AuthSignInUseCase;
    let userService: UserService;
    let authService: AuthService;
    let jwtService: JwtService;

    const mockUserService = {
        findByUsernameOrEmail: jest.fn(),
        updateRefreshToken: jest.fn(),
        findById: jest.fn(),
        clearRefreshTokenIfPresent: jest.fn(),
    };

    const mockAuthService = {
        generateAccessToken: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
        verifyAsync: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthSignInUseCase,
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();
        useCase = module.get<AuthSignInUseCase>(AuthSignInUseCase);
        userService = module.get<UserService>(UserService);
        authService = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    describe('signIn', () => {
        it('should return user data on successful login', async () => {
            const signInDto: SignInDto = { login: 'testuser', password: 'password123' };
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'testuser@example.com',
                name: 'Test User',
                role: 'USER',
                password: '$2b$10$hashedPassword',
                isActive: true,
            };

            const mockTokens = {
                accessToken: 'mock.access.token',
                refreshToken: 'mock.refresh.token',
                expiresIn: 3600,
            };

            mockUserService.findByUsernameOrEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed.refresh.token');
            mockAuthService.generateAccessToken.mockResolvedValue(mockTokens);
            mockUserService.updateRefreshToken.mockResolvedValue(undefined);

            const result = await useCase.signIn(signInDto);

            expect(mockUserService.findByUsernameOrEmail).toHaveBeenCalledWith('testuser');
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', '$2b$10$hashedPassword');
            expect(mockAuthService.generateAccessToken).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith('mock.refresh.token', 10);
            expect(mockUserService.updateRefreshToken).toHaveBeenCalledWith('123', 'hashed.refresh.token');
            expect(result).toEqual({
                statusCode: 200,
                status: true,
                code: 'SUCCESS',
                message: 'Login successful',
                data: {
                    user: {
                        id: '123',
                        name: 'Test User',
                        username: 'testuser',
                        email: 'testuser@example.com',
                        role: 'USER',
                    },
                    accessToken: 'mock.access.token',
                    refreshToken: 'mock.refresh.token',
                    expiresIn: 3600,
                },
            });
        });

        it('should throw UnauthorizedException if login or password is missing', async () => {
            const signInDto: SignInDto = { login: '', password: '' };

            await expect(useCase.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
            await expect(useCase.signIn(signInDto)).rejects.toThrow('username or email with password are required');
        });

        it('should throw UnauthorizedException if user does not exist', async () => {
            const signInDto: SignInDto = { login: 'nonexistent', password: 'password123' };
            mockUserService.findByUsernameOrEmail.mockResolvedValue(null);

            await expect(useCase.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
            await expect(useCase.signIn(signInDto)).rejects.toThrow('User incorrect');
        });

        it('should throw UnauthorizedException if password is incorrect', async () => {
            const signInDto: SignInDto = { login: 'testuser', password: 'wrongpassword' };
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'testuser@example.com',
                password: '$2b$10$hashedPassword',
            };

            mockUserService.findByUsernameOrEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(useCase.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
            await expect(useCase.signIn(signInDto)).rejects.toThrow('Invalid credentials or password');
        });
    });

    describe('refreshToken', () => {
        it('should return new tokens on successful refresh', async () => {
            const refreshDto = { refreshToken: 'valid.refresh.token' };
            const mockPayload = {
                sub: '123',
                username: 'testuser',
                email: 'testuser@example.com',
                role: 'USER',
            };
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'testuser@example.com',
                name: 'Test User',
                role: 'USER',
                password: '$2b$10$hashedPassword',
                refreshToken: 'valid.refresh.token',
                isActive: true,
            };
            const mockNewTokens = {
                accessToken: 'new.access.token',
                refreshToken: 'new.refresh.token',
                expiresIn: 3600,
            };

            mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
            mockUserService.findById.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed.new.refresh.token');
            mockAuthService.generateAccessToken.mockResolvedValue(mockNewTokens);
            mockUserService.updateRefreshToken.mockResolvedValue(undefined);

            const result = await useCase.refreshToken(refreshDto);

            expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid.refresh.token');
            expect(mockUserService.findById).toHaveBeenCalledWith('123');
            expect(bcrypt.compare).toHaveBeenCalledWith('valid.refresh.token', 'valid.refresh.token');
            expect(mockAuthService.generateAccessToken).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith('new.refresh.token', 10);
            expect(mockUserService.updateRefreshToken).toHaveBeenCalledWith('123', 'hashed.new.refresh.token');
            expect(result).toEqual({
                statusCode: 200,
                status: true,
                code: 'SUCCESS',
                message: 'Token refreshed successfully',
                data: {
                    accessToken: 'new.access.token',
                    refreshToken: 'new.refresh.token',
                    expiresIn: 3600,
                },
            });
        });

        it('should throw UnauthorizedException if refresh token is invalid', async () => {
            const refreshDto = { refreshToken: 'invalid.refresh.token' };
            mockJwtService.verifyAsync.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

            await expect(useCase.refreshToken(refreshDto)).rejects.toThrow(UnauthorizedException);
            await expect(useCase.refreshToken(refreshDto)).rejects.toThrow('Invalid or expired refresh token');
            expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('invalid.refresh.token');
        });
    });

    describe('logout', () => {
        it('should clear refresh token on logout', async () => {
            mockUserService.clearRefreshTokenIfPresent.mockResolvedValue({ affected: 1 });

            const result = await useCase.logout({ id: '123' });

            expect(mockUserService.clearRefreshTokenIfPresent).toHaveBeenCalledWith('123');
            expect(result).toEqual({
                statusCode: 200,
                status: true,
                code: "SUCCESS",
                message: "Logout successful",
                data: null
            });
        });
    });
});