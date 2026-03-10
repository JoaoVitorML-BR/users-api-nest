import { TokenGeneratorService } from "src/common/services/token-generator.service";
import { PasswordResetService } from "../password-reset.service";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class PasswordForgotUseCase {
    private readonly logger = new Logger(PasswordForgotUseCase.name);
    constructor(
        private readonly tokenGeneratorResetPassword: TokenGeneratorService,
        private readonly passwordResetService: PasswordResetService,
        @InjectQueue('email') private readonly emailQueue: Queue,
    ) { }

    async forgotPassword(email: string): Promise<void> {
        const userByEmailExists = await this.passwordResetService.findUserByEmail(email);
        if (!userByEmailExists) {
            this.logger.warn(`Password reset attempted for non-existent email: ${email}`);
            return;
        }

        if (!userByEmailExists.isActive) {
            this.logger.warn(`Password reset attempted for inactive user email: ${email}`);
            return;
        }

        await this.passwordResetService.removeOldTokens(userByEmailExists.id);

        const tokenGenerated = await this.tokenGeneratorResetPassword.generate();
        await this.passwordResetService.saveResetToken(userByEmailExists.id, tokenGenerated);

        await this.emailQueue.add({
            email: userByEmailExists.email,
            token: tokenGenerated,
            userName: userByEmailExists.username,
            type: 'password-reset',
        });

        this.logger.log(`Password reset token queued for email: ${email}`);
    }
}