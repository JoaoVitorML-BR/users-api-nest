import { Body, Controller, Patch, Post } from "@nestjs/common";
import { SendTokenUseCase } from "./use-cases/send-token.use-case";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from 'bull';
import { SendEmailDto } from "./dto/send-email.dto";
import { ActivateAccountUseCase } from "./use-cases/activate-account.use-case";

@Controller('email-confirmation')
export class EmailConfirmationTokenController {
    constructor(
        @InjectQueue('email') private readonly emailQueue: Queue,
        private readonly activateAccountUseCase: ActivateAccountUseCase,
        private readonly sendTokenUseCase: SendTokenUseCase
    ) { }

    @Patch('activate-account')
    async ActivateAccount(@Body() body: { token: string }) {
        const emailConfirmation = await this.activateAccountUseCase.execute(body.token);
        return emailConfirmation;
    }

    @Post('send-email')
    async sendEmail(@Body() dto: SendEmailDto) {
        await this.emailQueue.add({
            email: dto.email,
            token: dto.token,
        });
        return { message: 'E-mail será enviado em background.' };
    }
}