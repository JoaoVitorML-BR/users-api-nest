import { Body, Controller, UseGuards, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import { AuthSignInUseCase } from "./use-cases/auth-login.use-case";
import { SignInDto } from "./dto/sign-in.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { JwtGuard } from "./guards/jwt.guard";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { AuthenticatedUser } from "./types/auth.types";

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authUseCase: AuthSignInUseCase,
    ) { }

    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    @Post('login')
    async signIn(@Body() credentials: SignInDto) {
        const loginData = await this.authUseCase.signIn(credentials);

        return {
            statusCode: HttpStatus.OK,
            status: true,
            code: 'SUCCESS',
            message: 'Login successful',
            data: loginData,
        };
    }

    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    @Post('refresh')
    async refreshToken(@Body() dto: RefreshTokenDto) {
        const tokenData = await this.authUseCase.refreshToken(dto);

        return {
            statusCode: HttpStatus.OK,
            status: true,
            code: 'SUCCESS',
            message: 'Token refreshed successfully',
            data: tokenData,
        };
    }

    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtGuard)
    @Post('logout')
    async logout(@Req() req: Request & { user: AuthenticatedUser }) {
        await this.authUseCase.logout(req.user);

        return {
            statusCode: HttpStatus.OK,
            status: true,
            code: 'SUCCESS',
            message: 'Logout successful',
            data: null,
        };
    }
}