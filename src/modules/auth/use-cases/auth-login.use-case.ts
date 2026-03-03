import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { UserService } from "src/modules/users/user.service";
import { SignInDto } from "../dto/sign-in.dto";

import * as bcrypt from 'bcrypt';
import { ApiResponseDto } from "src/modules/users/dto/api-response.dto";
import { ResponseAuthLoginDTO } from "../dto/response-auth-login.dto";

import { AuthService } from "../auth.service";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { JwtService } from "@nestjs/jwt";
import { LogoutResponseDTO } from "../dto/logout.dto";
import { AuthenticatedUser, JwtPayload } from "../types/auth.types";

@Injectable()
export class AuthSignInUseCase {
    private readonly logger = new Logger(AuthSignInUseCase.name);

    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly jwtService: JwtService
    ) { }

    async signIn(signInDto: SignInDto): Promise<ApiResponseDto<ResponseAuthLoginDTO>> {
        const { login, password } = signInDto;
        this.logger.debug(`Login attempt for user: ${login}`);

        if (!login || !password) {
            this.logger.warn(`Login rejected due to missing credentials: ${login}`);
            throw new UnauthorizedException('username or email with password are required');
        }

        // check if the user exists by username or email
        const userExists = await this.userService.findByUsernameOrEmail(login);
        if (!userExists) {
            this.logger.warn(`Login failed: user not found for login ${login}`);
            throw new UnauthorizedException('User incorrect');
        }

        // Check if the provided password matches the stored hashed password
        const passwordMatch = await bcrypt.compare(password, userExists.password);
        if (!passwordMatch) {
            this.logger.warn(`Login failed: invalid password for user id ${userExists.id}`);
            throw new UnauthorizedException('Invalid credentials or password');
        }

        const { password: _, ...userWithoutPassword } = userExists;

        const tokens = await this.authService.generateAccessToken(userWithoutPassword);

        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);

        // Save only the hashed refresh token in the database
        await this.userService.updateRefreshToken(userWithoutPassword.id, hashedRefreshToken);
        this.logger.log(`Login successful for user id ${userWithoutPassword.id}`);

        return {
            statusCode: 200,
            status: true,
            code: "SUCCESS",
            message: "Login successful",
            data: {
                user: {
                    id: userWithoutPassword.id,
                    name: userWithoutPassword.name,
                    username: userWithoutPassword.username,
                    email: userWithoutPassword.email,
                    role: userWithoutPassword.role
                },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn
            }
        };
    }

    async refreshToken(dto: RefreshTokenDto) {
        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken);

            if (payload.tokenType !== 'refresh') {
                this.logger.warn(`Refresh token rejected: wrong token type for user id ${payload.sub}`);
                throw new UnauthorizedException('Invalid refresh token');
            }

            const user = await this.userService.findById(payload.sub);
            if (!user || !user.isActive) {
                this.logger.warn(`Refresh token rejected: user inactive or not found ${payload.sub}`);
                throw new UnauthorizedException('User not found or inactive');
            }

            const isValidRefreshToken =
                !!user.refreshToken && (await bcrypt.compare(dto.refreshToken, user.refreshToken));

            // Valid if the refresh token matches the hash stored in the database
            if (!isValidRefreshToken) {
                this.logger.warn(`Refresh token rejected: hash mismatch for user id ${user.id}`);
                throw new UnauthorizedException('Invalid refresh token');
            }

            const { password: _, ...userWithoutPassword } = user;

            const tokens = await this.authService.generateAccessToken(userWithoutPassword);

            // Hash refresh token before saving to the database for security
            const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);

            // Update the refresh token in the database
            await this.userService.updateRefreshToken(user.id, hashedRefreshToken);
            this.logger.log(`Refresh token rotated for user id ${user.id}`);

            return {
                statusCode: 200,
                status: true,
                code: "SUCCESS",
                message: "Token refreshed successfully",
                data: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: tokens.expiresIn
                }
            };
        } catch (error) {
            this.logger.warn('Refresh token flow failed due to invalid/expired token');
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async logout(user: Pick<AuthenticatedUser, 'id'>): Promise<ApiResponseDto<LogoutResponseDTO>> {
        const userId = user?.id;

        if (!userId) {
            this.logger.warn('Logout rejected: user not found in request context');
            throw new UnauthorizedException('User not found or inactive');
        }

        await this.userService.clearRefreshTokenIfPresent(userId);
        this.logger.log(`Logout successful for user id ${userId}`);

        return {
            statusCode: 200,
            status: true,
            code: "SUCCESS",
            message: "Logout successful",
            data: null,
        };
    }
}