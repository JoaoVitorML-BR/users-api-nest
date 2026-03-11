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
import { FindByIdUsersUseCase } from "./use-cases/find-by-id-users.use-case";

@Controller('users')
export class UserController {
    constructor(
        private readonly findAllUsersUseCase: FindAllUsersUseCase,
        private readonly createUsersUseCase: CreateUsersUseCase,
        private readonly createAdminUseCase: CreateUsersAdminUseCase,
        private readonly updateUseCase: UpdateUserUseCase,
        private readonly updatePasswordUseCase: UpdatePasswordUseCase,
        private readonly findByIdUserUseCase: FindByIdUsersUseCase
    ) { }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(ROLE.ADMIN_MASTER, ROLE.ADMIN)
    @Get()
    async findAll() {
        const users = await this.findAllUsersUseCase.findAll();

        return {
            statusCode: 200,
            status: true,
            code: 'SUCCESS',
            message: 'Users retrieved successfully',
            data: users,
        };
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(ROLE.ADMIN_MASTER)
    @Post('create-admin')
    async createAdmin(@Body() Data: CreateUserAdminDTO) {
        const createdAdmin = await this.createAdminUseCase.createAdmin(Data);

        return {
            statusCode: 201,
            status: true,
            code: 'CREATED',
            message: 'Admin user created successfully',
            data: createdAdmin,
        };
    }

    @Post()
    async create(@Body() Data: CreateUserDTO) {
        const createdUser = await this.createUsersUseCase.create(Data);

        return {
            statusCode: 201,
            status: true,
            code: 'CREATED',
            message: 'User created successfully',
            data: createdUser,
        };
    }

    @UseGuards(JwtGuard, RolesGuard, AuthorizationGuard)
    @Roles(ROLE.ADMIN_MASTER, ROLE.ADMIN, ROLE.USER)
    @Patch(':id')
    async update(@Body() Data: UpdateUserDTO, @Param('id') id: string) {
        const updatedUser = await this.updateUseCase.update(Data, id);

        return {
            statusCode: 200,
            status: true,
            code: 'SUCCESS',
            message: 'User updated successfully',
            data: updatedUser,
        };
    }

    @UseGuards(JwtGuard)
    @Patch('/password/:id')
    async updatePassword(@Request() req: any, @Body() Data: UpdatePasswordUserDTO, @Param('id') id: string) {
        await this.updatePasswordUseCase.updatePassword(Data, id, req.user.id);

        return {
            statusCode: 200,
            status: true,
            code: 'SUCCESS',
            message: 'Password updated successfully',
            data: null,
        };
    }

    @UseGuards(JwtGuard, RolesGuard, AuthorizationGuard)
    @Roles(ROLE.ADMIN_MASTER, ROLE.ADMIN, ROLE.USER)
    @Get(':id')
    async findById(@Param('id') id: string) {
        const user = await this.findByIdUserUseCase.findById(id);

        return {
            statusCode: 200,
            status: true,
            code: 'SUCCESS',
            message: 'User retrieved successfully',
            data: user,
        };
    }
}