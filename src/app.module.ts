import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './modules/users/user.entity';
import { UsersModule } from './modules/users/users.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { EmailConfirmation } from './modules/users/email-confirmation/email-confirmation.entity';
import { ResetPasswordToken } from './modules/auth/password-reset/password-reset.entity';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

const isTestEnvironment = process.env.NODE_ENV === 'test';
const shouldSynchronizeSchema =
  process.env.NODE_ENV === 'development' && process.env.DB_SYNCHRONIZE === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            limit: configService.get<number>('THROTTLE_LIMIT', 20),
            ttl: configService.get<number>('THROTTLE_TTL_MS', 60_000),
          },
        ],
      }),
    }),
    TypeOrmModule.forRoot(
      isTestEnvironment
        ? {
          type: 'sqlite',
          database: ':memory:',
          entities: [User, EmailConfirmation, ResetPasswordToken],
          synchronize: true,
          logging: false,
        }
        : {
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          entities: [User, EmailConfirmation, ResetPasswordToken],
          synchronize: shouldSynchronizeSchema,
          logging: true,
        },
    ),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
