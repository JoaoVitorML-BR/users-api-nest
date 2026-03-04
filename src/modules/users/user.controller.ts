import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
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

@Controller('users')
export class UserController {
    constructor(
        private readonly findAllUsersUseCase: FindAllUsersUseCase,
        private readonly createUsersUseCase: CreateUsersUseCase,
        private readonly createAdminUseCase: CreateUsersAdminUseCase,
        private readonly updateUseCase: UpdateUserUseCase,
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
}