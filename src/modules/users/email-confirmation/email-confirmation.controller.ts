import { Body, Controller, Patch, Post } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from 'bull';
import { SendEmailDto } from "./dto/send-email.dto";
import { ConfirmEmailDto } from "./dto/confirm-email.dto";
import { ActivateAccountUseCase } from "./use-cases/activate-account.use-case";

@Controller('email-confirmation')
export class EmailConfirmationTokenController {
    constructor(
        @InjectQueue('email') private readonly emailQueue: Queue,
        private readonly activateAccountUseCase: ActivateAccountUseCase,
    ) { }

    @Patch('activate-account')
    async ActivateAccount(@Body() body: ConfirmEmailDto) {
        const emailConfirmation = await this.activateAccountUseCase.execute(body.token);
        return emailConfirmation;
    }

    @Post('send-email')
    async sendEmail(@Body() dto: SendEmailDto) {
        await this.emailQueue.add({
            email: dto.email,
            token: dto.token,
        });
        return {
            statusCode: 200,
            status: true,
            code: "SUCCESS",
            message: "Email sent successfully",
        };
    }
}