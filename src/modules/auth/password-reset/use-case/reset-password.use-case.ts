import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ResetPasswordDTO } from "../dto/reset-password.dto";
import { PasswordResetService } from "../password-reset.service";
import * as bcrypt from 'bcrypt';

@Injectable()
export class PassworResetdUseCase {
    private readonly logger = new Logger(PassworResetdUseCase.name);
    constructor(
        private readonly passwordResetService: PasswordResetService,
    ) { }

    async resetPassword(data: ResetPasswordDTO): Promise<void> {
        if (data.newPassword !== data.confirmNewPassword) {
            throw new BadRequestException('New password and confirm new password do not match');
        }

        const passwordEncrypted = await bcrypt.hash(data.newPassword, 10);

        await this.passwordResetService.resetPassword(data.token, passwordEncrypted);
        this.logger.log(`Password reset successful for token: ${data.token}`);
    }
}