import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TokenGeneratorService } from "src/common/services/token-generator.service";
import { UsersModule } from "src/modules/users/users.module";
import { PasswordResetController } from "./password-reset.controller";
import { ResetPasswordToken } from "./password-reset.entity";
import { PasswordResetService } from "./password-reset.service";
import { PassworResetdUseCase } from "./use-case/reset-password.use-case";
import { PasswordForgotUseCase } from "./use-case/forgot-password.use-case";

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'email',
        }),
        ConfigModule,
        UsersModule,
        TypeOrmModule.forFeature([ResetPasswordToken]),
    ],
    controllers: [PasswordResetController],
    providers: [
        PasswordResetService,
        PassworResetdUseCase,
        TokenGeneratorService,
        PasswordForgotUseCase,
    ],
    exports: [PasswordResetService, PassworResetdUseCase],
})

export class PasswordResetModule { }