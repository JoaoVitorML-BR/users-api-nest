import { Body, Controller, Patch, Post } from "@nestjs/common";
import { SendEmailDto } from "./dto/send-email.dto";
import { ConfirmEmailDto } from "./dto/confirm-email.dto";
import { ActivateAccountUseCase } from "./use-cases/activate-account.use-case";
import { SendTokenUseCase } from "./use-cases/send-token.use-case";
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiEnvelopeResponse, ApiErrorEnvelopeResponse } from 'src/common/swagger/api-envelope-response.decorator';

@ApiTags('Email Confirmation')
@Controller('email-confirmation')
export class EmailConfirmationTokenController {
    constructor(
        private readonly activateAccountUseCase: ActivateAccountUseCase,
        private readonly sendTokenUseCase: SendTokenUseCase,
    ) { }

    @Patch('activate-account')
    @ApiOperation({ summary: 'Activate the account using the confirmation token.' })
    @ApiBody({ type: ConfirmEmailDto })
    @ApiEnvelopeResponse({
        status: 200,
        description: 'Account activated successfully.',
    })
    @ApiErrorEnvelopeResponse(400, 'Invalid confirmation token.', 'BAD_REQUEST', 'Invalid token')
    async ActivateAccount(@Body() body: ConfirmEmailDto) {
        await this.activateAccountUseCase.execute(body.token);

        return {
            statusCode: 200,
            status: true,
            code: "SUCCESS",
            message: "Account activated successfully",
            data: null,
        };
    }

    @Post('send-email')
    @ApiOperation({ summary: 'Resend the confirmation email with the confirmation token.' })
    @ApiBody({ type: SendEmailDto })
    @ApiEnvelopeResponse({
        status: 200,
        description: 'Confirmation email sent successfully.',
    })
    @ApiErrorEnvelopeResponse(400, 'Invalid payload.', 'BAD_REQUEST', ['email must be an email'])
    async sendEmail(@Body() dto: SendEmailDto) {
        await this.sendTokenUseCase.execute({ email: dto.email });

        return {
            statusCode: 200,
            status: true,
            code: "SUCCESS",
            message: "Email sent successfully",
            data: null,
        };
    }
}