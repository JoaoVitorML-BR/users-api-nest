import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserService } from "src/modules/users/user.service";
import { SignInDto } from "../dto/sign-in.dto";

import * as bcrypt from 'bcrypt';
import { ApiResponseDto } from "src/modules/users/dto/api-response.dto";
import { ResponseAuthLoginDTO } from "../dto/response-auth-login.dto";

import { AuthService } from "../auth.service";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { JwtService } from "@nestjs/jwt";
import { LogoutResponseDTO } from "../dto/logout.dto";

@Injectable()
export class AuthSignInUseCase {
    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly jwtService: JwtService
    ) { }

    async signIn(signInDto: SignInDto): Promise<ApiResponseDto<ResponseAuthLoginDTO>> {
        const { login, password } = signInDto;
        if (!login || !password) {
            throw new UnauthorizedException('username or email with password are required');
        }

        // check if the user exists by username or email
        const userExists = await this.userService.findByUsernameOrEmail(login);
        if (!userExists) {
            throw new UnauthorizedException('User incorrect');
        }

        // Check if the provided password matches the stored hashed password
        const passwordMatch = await bcrypt.compare(password, userExists.password);
        if (!passwordMatch) {
            throw new UnauthorizedException('Invalid credentials or password');
        }

        const { password: _, ...userWithoutPassword } = userExists;

        const tokens = await this.authService.generateAccessToken(userWithoutPassword);

        // Salvar refreshToken no banco
        await this.userService.updateRefreshToken(userWithoutPassword.id, tokens.refreshToken);

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
            const payload = await this.jwtService.verifyAsync(dto.refreshToken);

            const user = await this.userService.findById(payload.sub);
            if (!user || !user.isActive) {
                throw new UnauthorizedException('User not found or inactive');
            }

            // Valid if the refresh token matches the one stored in the database
            if (user.refreshToken !== dto.refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const { password: _, ...userWithoutPassword } = user;

            const tokens = await this.authService.generateAccessToken(userWithoutPassword);

            // Update the refresh token in the database
            await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

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
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async logout(user: any): Promise<ApiResponseDto<LogoutResponseDTO>> {
        const userId = user?.sub ?? user?.id;

        if (!userId) {
            throw new UnauthorizedException('User not found or inactive');
        }

        await this.userService.clearRefreshTokenIfPresent(userId);

        return {
            statusCode: 200,
            status: true,
            code: "SUCCESS",
            message: "Logout successful",
            data: null,
        };
    }
}