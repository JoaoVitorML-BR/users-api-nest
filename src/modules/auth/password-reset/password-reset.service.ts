import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { UserService } from "src/modules/users/user.service";
import { Repository } from "typeorm";
import { ResetPasswordToken } from "./password-reset.entity";

@Injectable()
export class PasswordResetService {
    constructor(
        @InjectRepository(ResetPasswordToken)
        private readonly resetTokenRepository: Repository<ResetPasswordToken>,
        private readonly userService: UserService,
        private readonly configService: ConfigService,
    ) { }

    async saveResetToken(userId: string, token: string): Promise<ResetPasswordToken> {
        const expiresInMinutes = this.configService.get<number>('PASSWORD_RESET_EXPIRES_IN_MINUTES', 15);
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

        const resetToken = this.resetTokenRepository.create({
            userId,
            token,
            expiresAt,
        });

        return await this.resetTokenRepository.save(resetToken);
    }

    async removeOldTokens(userId: string): Promise<void> {
        await this.resetTokenRepository.delete({ userId });
    }

    async validateToken(token: string): Promise<ResetPasswordToken | null> {
        const resetToken = await this.resetTokenRepository.findOne({
            where: { token },
        });

        if (!resetToken) {
            return null;
        }

        // Verify if token expires
        if (resetToken.expiresAt < new Date()) {
            await this.resetTokenRepository.remove(resetToken);
            return null;
        }

        return resetToken;
    }

    async consumeToken(token: string): Promise<void> {
        await this.resetTokenRepository.delete({ token });
    }

    async findUserByEmail(email: string) {
        return this.userService.findByEmail(email);
    }

    async resetPassword(token: string, newPassword: string) {
        const resetToken = await this.validateToken(token);
        if (!resetToken) {
            throw new BadRequestException('Invalid or expired token');
        }

        await this.userService.updatePassword(resetToken.userId, newPassword);
        await this.userService.updateRefreshToken(resetToken.userId, null);
        await this.consumeToken(token);
    }
}