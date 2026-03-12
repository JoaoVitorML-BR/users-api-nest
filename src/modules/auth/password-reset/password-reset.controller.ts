import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ForgotPasswordDTO, ResetPasswordDTO } from "./dto/reset-password.dto";
import { ApiResponseDto } from "src/modules/users/dto/api-response.dto";
import { PassworResetdUseCase } from "./use-case/reset-password.use-case";
import { PasswordForgotUseCase } from "./use-case/forgot-password.use-case";
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiEnvelopeResponse, ApiErrorEnvelopeResponse } from 'src/common/swagger/api-envelope-response.decorator';

@ApiTags('Password Reset')
@Controller('auth/password')
export class PasswordResetController {

    constructor(
        private readonly passwordForgotUseCase: PasswordForgotUseCase,
        private readonly resetPasswordUseCase: PassworResetdUseCase,
    ) { }

    @HttpCode(HttpStatus.OK)
    @Post('forgot')
    @ApiOperation({ summary: 'Request that the password recovery token be sent by email.' })
    @ApiBody({ type: ForgotPasswordDTO })
    @ApiEnvelopeResponse({
        status: HttpStatus.OK,
        description: 'Recovery flow initiated with a neutral response.',
    })
    @ApiErrorEnvelopeResponse(HttpStatus.BAD_REQUEST, 'Payload invalid.', 'BAD_REQUEST', ['Invalid email address'])
    async forgotPassword(@Body() data: ForgotPasswordDTO): Promise<ApiResponseDto<null>> {
        await this.passwordForgotUseCase.forgotPassword(data.email);
        return {
            statusCode: HttpStatus.OK,
            code: 'SUCCESS',
            status: true,
            message: 'If the email exists in our system, a password reset token has been sent.',
        }
    }   

    @HttpCode(HttpStatus.OK)
    @Post('reset')
    @ApiOperation({ summary: 'Reset the password using the recovery token.' })
    @ApiBody({ type: ResetPasswordDTO })
    @ApiEnvelopeResponse({
        status: HttpStatus.OK,
        description: 'Password reset successfully.',
    })
    @ApiErrorEnvelopeResponse(HttpStatus.BAD_REQUEST, 'Invalid payload or malformed token.', 'BAD_REQUEST', ['The password must be at least 8 characters long and include uppercase, lowercase, number and symbol.'])
    async resetPasswordWithToken(@Body() data: ResetPasswordDTO): Promise<ApiResponseDto<null>> {
        await this.resetPasswordUseCase.resetPassword(data);
        return {
            statusCode: HttpStatus.OK,
            code: 'SUCCESS',
            status: true,
            message: 'Password reset successfully.',
        }
    }
}