import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { TokenGeneratorService } from "src/common/services/token-generator.service";
import { ResetPasswordDTO } from "../dto/reset-password.dto";
import { PasswordResetService } from "../password-reset.service";
import * as bcrypt from 'bcrypt';

@Injectable()
export class ResetPasswordUseCase {
    private readonly logger = new Logger(ResetPasswordUseCase.name);
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

    async resetPassword(data: ResetPasswordDTO): Promise<void> {
        if (data.newPassword !== data.confirmNewPassword) {
            throw new BadRequestException('New password and confirm new password do not match');
        }

        const passwordEncrypted = await bcrypt.hash(data.newPassword, 10);

        await this.passwordResetService.resetPassword(data.token, passwordEncrypted);
        this.logger.log(`Password reset successful for token: ${data.token}`);
    }
}