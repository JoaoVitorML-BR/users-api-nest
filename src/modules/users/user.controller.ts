import { Body, Controller, Get, Param, Patch, Post, UseGuards, Request } from "@nestjs/common";
import { FindAllUsersUseCase } from "./use-cases/find-all-users.use-case";
import { CreateUserAdminDTO, CreateUserDTO } from "./dto/create-users.dto";
import { CreateUsersUseCase } from "./use-cases/create-users.use-case";
import { CreateUsersAdminUseCase } from "./use-cases/create-users-admin.use-case";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ROLE } from "./user.entity";
import { UpdateUserDTO } from "./dto/update-user.dto";
import { UpdateUserUseCase } from "./use-cases/update-user.use-case";
import { AuthorizationGuard } from "../auth/guards/authorization.guard";
import { UpdatePasswordUserDTO } from "./dto/update-password-user.dto";
import { UpdatePasswordUseCase } from "./use-cases/update-user-password.use-case";

@Controller('users')
export class UserController {
    constructor(
        private readonly findAllUsersUseCase: FindAllUsersUseCase,
        private readonly createUsersUseCase: CreateUsersUseCase,
        private readonly createAdminUseCase: CreateUsersAdminUseCase,
        private readonly updateUseCase: UpdateUserUseCase,
        private readonly updatePasswordUseCase: UpdatePasswordUseCase
    ) { }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(ROLE.ADMIN_MASTER, ROLE.ADMIN)
    @Get()
    async findAll() {
        return this.findAllUsersUseCase.findAll();
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(ROLE.ADMIN_MASTER)
    @Post('create-admin')
    async createAdmin(@Body() Data: CreateUserAdminDTO) {
        return this.createAdminUseCase.createAdmin(Data);
    }

    @Post()
    async create(@Body() Data: CreateUserDTO) {
        return this.createUsersUseCase.create(Data);
    }

    @UseGuards(JwtGuard, RolesGuard, AuthorizationGuard)
    @Roles(ROLE.ADMIN_MASTER, ROLE.ADMIN, ROLE.USER)
    @Patch(':id')
    async update(@Body() Data: UpdateUserDTO, @Param('id') id: string) {
        return this.updateUseCase.update(Data, id);
    }

    @UseGuards(JwtGuard)
    @Patch('/password/:id')
    async updatePassword(@Request() req: any, @Body() Data: UpdatePasswordUserDTO, @Param('id') id: string) {
        return this.updatePasswordUseCase.updatePassword(Data, id, req.user.id);
    }
}