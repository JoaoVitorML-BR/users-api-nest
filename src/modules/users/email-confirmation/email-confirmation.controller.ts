import { Body, Controller, Patch, Post } from "@nestjs/common";
import { SendEmailDto } from "./dto/send-email.dto";
import { ConfirmEmailDto } from "./dto/confirm-email.dto";
import { ActivateAccountUseCase } from "./use-cases/activate-account.use-case";
import { SendTokenUseCase } from "./use-cases/send-token.use-case";

@Controller('email-confirmation')
export class EmailConfirmationTokenController {
    constructor(
        private readonly activateAccountUseCase: ActivateAccountUseCase,
        private readonly sendTokenUseCase: SendTokenUseCase,
    ) { }

    @Patch('activate-account')
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