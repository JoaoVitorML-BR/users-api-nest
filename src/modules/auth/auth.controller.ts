import { Body, Controller, UseGuards, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import { AuthSignInUseCase } from "./use-cases/auth-login.use-case";
import { SignInDto } from "./dto/sign-in.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { JwtGuard } from "./guards/jwt.guard";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { AuthenticatedUser } from "./types/auth.types";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseAuthLoginDTO } from './dto/response-auth-login.dto';
import { ApiEnvelopeResponse, ApiErrorEnvelopeResponse } from 'src/common/swagger/api-envelope-response.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authUseCase: AuthSignInUseCase,
    ) { }

    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    @Post('login')
    @ApiOperation({ summary: 'Authenticates with username or email and returns access/refresh token.' })
    @ApiBody({ type: SignInDto })
    @ApiEnvelopeResponse({
        status: HttpStatus.OK,
        description: 'Login successful.',
        type: ResponseAuthLoginDTO,
    })
    @ApiErrorEnvelopeResponse(HttpStatus.UNAUTHORIZED, 'Invalid credentials.', 'UNAUTHORIZED', 'Unauthorized')
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
    @ApiOperation({ summary: 'Refresh the refresh token and emit a new pair of tokens.' })
    @ApiBody({ type: RefreshTokenDto })
    @ApiEnvelopeResponse({
        status: HttpStatus.OK,
        description: 'Tokens refreshed successfully.',
        type: ResponseAuthLoginDTO,
    })
    @ApiErrorEnvelopeResponse(HttpStatus.UNAUTHORIZED, 'Invalid or expired refresh token.', 'UNAUTHORIZED', 'Unauthorized')
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
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Invalidates the persisted refresh token of the authenticated user.' })
    @ApiEnvelopeResponse({
        status: HttpStatus.OK,
        description: 'Logout successful.',
    })
    @ApiErrorEnvelopeResponse(HttpStatus.UNAUTHORIZED, 'Missing or invalid access token.', 'UNAUTHORIZED', 'Unauthorized')
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