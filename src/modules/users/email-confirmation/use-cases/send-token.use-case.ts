import { TokenGeneratorService } from "src/common/services/token-generator.service";
import { SendEmailConfirmationDto } from "../dto/send-email-confirmation.dto";
import { BadRequestException, Injectable } from "@nestjs/common";
import { EmailConfirmationService } from "../email-confirmation.service";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";

@Injectable()
export class SendTokenUseCase {
    constructor(
        private readonly tokenGeneratorService: TokenGeneratorService,
        private readonly emailConfirmationService: EmailConfirmationService,
        @InjectQueue('email') private readonly emailQueue: Queue
    ) {}
    async execute(email: SendEmailConfirmationDto): Promise<void> {
        try {
            const generatedToken = this.tokenGeneratorService.generate();
            if (!generatedToken) {
                throw new BadRequestException('Failed to generate token.');
            }

            if (!email.email) {
                throw new BadRequestException('Email is required to send the token.');
            }

            const tokenSave = await this.emailConfirmationService.saveToken(email.email, generatedToken);
            if (!tokenSave) {
                throw new BadRequestException('Failed to save token.');
            }

            const sendEmailResult = await this.emailQueue.add({
                email: email.email,
                token: generatedToken
            });
            if (!sendEmailResult) {
                throw new Error('Failed to send email with the token.');
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(error.message || 'Failed to send token');
        }
    }
}