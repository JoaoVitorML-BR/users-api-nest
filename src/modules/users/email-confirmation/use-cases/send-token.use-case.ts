import { TokenGeneratorService } from "src/common/services/token-generator.service";
import { SendEmailConfirmationDto } from "../dto/send-email-confirmation.dto";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { EmailConfirmationService } from "../email-confirmation.service";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { SendTokenFromEmailService } from "src/common/services/send-email-token.service";

@Injectable()
export class SendTokenUseCase {
    private readonly logger = new Logger(SendTokenUseCase.name);

    constructor(
        private readonly tokenGeneratorService: TokenGeneratorService,
        private readonly emailConfirmationService: EmailConfirmationService,
        private readonly sendTokenFromEmailService: SendTokenFromEmailService,
        @InjectQueue('email') private readonly emailQueue: Queue
    ) {}

    private async enqueueWithTimeout(payload: { email: string; token: string }, timeoutMs = 3000): Promise<boolean> {
        try {
            const enqueuePromise = this.emailQueue.add(payload, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: true,
                removeOnFail: false,
            });

            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Queue enqueue timeout')), timeoutMs);
            });

            await Promise.race([enqueuePromise, timeoutPromise]);
            return true;
        } catch (error) {
            this.logger.warn(`Queue unavailable for ${payload.email}: ${error?.message || 'unknown error'}`);
            return false;
        }
    }

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

            const enqueued = await this.enqueueWithTimeout({
                email: email.email,
                token: generatedToken
            });

            if (!enqueued) {
                const sentDirectly = await this.sendTokenFromEmailService.sendToken(
                    email.email,
                    generatedToken,
                    'email-confirmation'
                );

                if (!sentDirectly) {
                    throw new Error('Failed to send email with the token.');
                }
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(error.message || 'Failed to send token');
        }
    }
}