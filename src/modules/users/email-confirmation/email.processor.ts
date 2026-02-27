import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { SendTokenFromEmailService } from 'src/common/services/send-email-token.service';

// Process the email sending in the background using Bull
@Processor('email') // name of the queue
export class EmailConfirmationProcessor {
    constructor(private readonly sendTokenFromEmailService: SendTokenFromEmailService) { }

    @Process() // Process all jobs in the 'email' queue
    async handleSendEmail(job: Job) {
        const { email, token } = job.data;
        await this.sendTokenFromEmailService.sendToken(email, token);
    }
}