import { Body, Controller, UseGuards, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import { AuthSignInUseCase } from "./use-cases/auth-login.use-case";
import { SignInDto } from "./dto/sign-in.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { JwtGuard } from "./guards/jwt.guard";
import { ApiResponseDto } from "../users/dto/api-response.dto";
import { LogoutResponseDTO } from "./dto/logout.dto";

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authUseCase: AuthSignInUseCase,
    ) { }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(@Body() credentials: SignInDto) {
        return this.authUseCase.signIn(credentials);
    }

    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    async refreshToken(@Body() dto: RefreshTokenDto) {
        return this.authUseCase.refreshToken(dto);
    }

    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtGuard)
    @Post('logout')
    async logout(@Req() req): Promise<ApiResponseDto<LogoutResponseDTO>> {
        return this.authUseCase.logout(req.user);
    }
}