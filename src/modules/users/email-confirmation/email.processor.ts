import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { SendTokenFromEmailService } from 'src/common/services/send-email-token.service';

// Process the email sending in the background using Bull
@Processor('email') // name of the queue
export class EmailConfirmationProcessor {
    private readonly logger = new Logger(EmailConfirmationProcessor.name);

    constructor(private readonly sendTokenFromEmailService: SendTokenFromEmailService) { }

    @Process() // Process all jobs in the 'email' queue
    async handleSendEmail(job: Job) {
        const { email, token, type, userName } = job.data;
        this.logger.log(`Processing email job ${job.id} for ${email}`);

        const sent = await this.sendTokenFromEmailService.sendToken(email, token, type, userName);

        if (!sent) {
            this.logger.error(`Email job ${job.id} failed for ${email}`);
            return;
        }

        this.logger.log(`Email job ${job.id} completed for ${email}`);
    }
}