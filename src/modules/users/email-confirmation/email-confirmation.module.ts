import { TypeOrmModule } from "@nestjs/typeorm";
import { EmailConfirmation } from "./email-confirmation.entity";
import { EmailConfirmationTokenController } from "./email-confirmation.controller";
import { SendTokenUseCase } from "./use-cases/send-token.use-case";
import { EmailConfirmationService } from "./email-confirmation.service";
import { Module } from "@nestjs/common";
import { TokenGeneratorService } from "src/common/services/token-generator.service";
import { SendTokenFromEmailService } from "src/common/services/send-email-token.service";
import { BullModule } from "@nestjs/bull";
import { User } from "../user.entity";
import { ActivateAccountUseCase } from "./use-cases/activate-account.use-case";
import { EmailConfirmationProcessor } from "./email.processor";

@Module({
    imports: [
        TypeOrmModule.forFeature([EmailConfirmation, User]),
        BullModule.registerQueue({
            name: 'email',
        }),
    ],
    controllers: [EmailConfirmationTokenController],
    providers: [
        EmailConfirmationService,
        SendTokenUseCase,
        TokenGeneratorService,
        SendTokenFromEmailService,
        ActivateAccountUseCase,
        EmailConfirmationProcessor
    ],
    exports: [EmailConfirmationService, SendTokenUseCase],
})
export class EmailConfirmationModule { }