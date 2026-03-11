import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { EmailConfirmation } from './email-confirmation/email-confirmation.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { FindAllUsersUseCase } from './use-cases/find-all-users.use-case';
import { CreateUsersUseCase } from './use-cases/create-users.use-case';
import { CreateUsersAdminUseCase } from './use-cases/create-users-admin.use-case';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EmailConfirmationModule } from './email-confirmation/email-confirmation.module';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { UpdatePasswordUseCase } from './use-cases/update-user-password.use-case';
import { FindByIdUsersUseCase } from './use-cases/find-by-id-users.use-case';

@Module({
    imports: [TypeOrmModule.forFeature([User, EmailConfirmation]), EmailConfirmationModule],
    controllers: [UserController],
    providers: [
           UserService, 
           FindAllUsersUseCase,
           CreateUsersUseCase,
           CreateUsersAdminUseCase,
           UpdateUserUseCase,
           UpdatePasswordUseCase,
           FindByIdUsersUseCase,
           RolesGuard,
    ],
    exports: [UserService],
})
export class UsersModule { }