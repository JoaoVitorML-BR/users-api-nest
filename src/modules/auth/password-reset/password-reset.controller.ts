import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ForgotPasswordDTO, ResponseResetPasswordDTO, ResetPasswordDTO } from "./dto/reset-password.dto";
import { ApiResponseDto } from "src/modules/users/dto/api-response.dto";
import { ResetPasswordUseCase } from "./use-case/reset-password.use-case";

@Controller('auth/password')
export class PasswordResetController {

    constructor(
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
    ) { }

    @HttpCode(HttpStatus.OK)
    @Post('forgot')
    async forgotPassword(@Body() data: ForgotPasswordDTO): Promise<ApiResponseDto<ResponseResetPasswordDTO>> {
        await this.resetPasswordUseCase.forgotPassword(data.email);
        return {
            statusCode: HttpStatus.OK,
            code: 'SUCCESS',
            status: true,
            message: `if the email ${data.email} exists in our system, a password reset token has been sent.`,
        }
    }   

    @HttpCode(HttpStatus.OK)
    @Post('reset')
    async resetPasswordWithToken(@Body() data: ResetPasswordDTO): Promise<ApiResponseDto<ResponseResetPasswordDTO>> {
        await this.resetPasswordUseCase.resetPassword(data);
        return {
            statusCode: HttpStatus.OK,
            code: 'SUCCESS',
            status: true,
            message: 'Password reset successfully.',
        }
    }
}