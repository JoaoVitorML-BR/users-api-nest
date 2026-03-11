import { InjectRepository } from "@nestjs/typeorm";
import { EmailConfirmation } from "./email-confirmation.entity";
import { Repository } from "typeorm";
import { BadRequestException, Injectable } from "@nestjs/common";
import { User } from "../user.entity";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EmailConfirmationService {
    constructor(
        @InjectRepository(EmailConfirmation) private readonly emailConfirmationEntity: Repository<EmailConfirmation>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
    ) { }

    async saveToken(email: string, token: string): Promise<EmailConfirmation> {
        try {
            const user = await this.userRepository.findOne({ where: { email } });
            if (!user) {
                throw new Error('User not found for the provided email.');
            }

            const expiresInHours = this.configService.get<number>('EMAIL_CONFIRMATION_EXPIRES_IN_HOURS', 24);
            const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
            const emailConfirmation = this.emailConfirmationEntity.create({ token, user, expiresAt });
            return await this.emailConfirmationEntity.save(emailConfirmation);
        } catch (error) {
            throw new Error(`Failed to save token: ${error.message}`);
        }
    }

    async activateAccount(token: string): Promise<void> {
        const emailConfirmation = await this.emailConfirmationEntity.findOne({
            where: { token },
            relations: ['user'],
        });

        if (!emailConfirmation) {
            throw new BadRequestException('Token not found.');
        }
        if (!emailConfirmation.expiresAt) {
            throw new BadRequestException('Token expiration date not set.');
        }
        if (emailConfirmation.expiresAt < new Date()) {
            await this.emailConfirmationEntity.remove(emailConfirmation);
            throw new BadRequestException('Token has expired. Please request a new one.');
        }

        emailConfirmation.user.isActive = true;
        emailConfirmation.user.emailConfirmed = true;
        await this.emailConfirmationEntity.remove(emailConfirmation);
        await this.userRepository.save(emailConfirmation.user);
    }
}