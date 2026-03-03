import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthSignInUseCase } from "./use-cases/auth-login.use-case";
import { UsersModule } from "../users/users.module";
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from "./strategies/jwt.strategy";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { parseExpiresInToSeconds } from "src/common/utils/time.util";

@Module({
    imports: [
        ConfigModule,
        UsersModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const jwtSecret = configService.get<string>('JWT_SECRET');
                if (!jwtSecret) {
                    throw new Error('JWT_SECRET is not configured.');
                }

                return {
                    secret: jwtSecret,
                    signOptions: {
                        expiresIn: parseExpiresInToSeconds(
                            configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '1h'),
                        ),
                    },
                };
            },
        })],
    controllers: [AuthController],
    providers: [
        AuthService,
        AuthSignInUseCase,
        JwtStrategy,
    ],
    exports: [AuthService],
})

export class AuthModule { }