import { Body, Controller, UseGuards, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import { AuthSignInUseCase } from "./use-cases/auth-login.use-case";
import { SignInDto } from "./dto/sign-in.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { JwtGuard } from "./guards/jwt.guard";
import { ApiResponseDto } from "../users/dto/api-response.dto";
import { LogoutResponseDTO } from "./dto/logout.dto";
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
        return this.authUseCase.signIn(credentials);
    }

    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    @Post('refresh')
    async refreshToken(@Body() dto: RefreshTokenDto) {
        return this.authUseCase.refreshToken(dto);
    }

    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtGuard)
    @Post('logout')
    async logout(@Req() req: Request & { user: AuthenticatedUser }): Promise<ApiResponseDto<LogoutResponseDTO>> {
        return this.authUseCase.logout(req.user);
    }
}