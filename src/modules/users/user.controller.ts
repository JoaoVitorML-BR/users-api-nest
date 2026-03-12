import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Request } from "@nestjs/common";
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
import { FindByEmailUsersUseCase } from "./use-cases/find-by-email-users.use-case";
import { FindByUsernameUsersUseCase } from "./use-cases/find-by-username-users.use-case";
import { PageOptionsDto } from "./dto/page-options.dto";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiEnvelopeResponse, ApiErrorEnvelopeResponse } from 'src/common/swagger/api-envelope-response.decorator';
import { FindAllUsersResponseDto } from './dto/find-all-uses-response.dto';
import { ResponseCreateUsersDto } from './dto/response-create-users.dto';
import { PageMetaDto } from './dto/page-meta.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(
        private readonly findAllUsersUseCase: FindAllUsersUseCase,
        private readonly createUsersUseCase: CreateUsersUseCase,
        private readonly createAdminUseCase: CreateUsersAdminUseCase,
        private readonly updateUseCase: UpdateUserUseCase,
        private readonly updatePasswordUseCase: UpdatePasswordUseCase,
        private readonly findByIdUserUseCase: FindByIdUsersUseCase,
        private readonly findByEmailUseCase: FindByEmailUsersUseCase,
        private readonly findByUsernameUseCase: FindByUsernameUsersUseCase
    ) { }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(ROLE.ADMIN_MASTER, ROLE.ADMIN)
    @Get()
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'List of users with pagination' })
    @ApiEnvelopeResponse({
        status: 200,
        description: 'Users successfully recovered.',
        type: FindAllUsersResponseDto,
        isArray: true,
        metaType: PageMetaDto,
    })
    @ApiErrorEnvelopeResponse(401, 'Access token missing or invalid.', 'UNAUTHORIZED', 'Unauthorized')
    @ApiErrorEnvelopeResponse(403, 'Profile without permission to list users..', 'FORBIDDEN', 'Forbidden resource')
    async findAll(@Query() pageOptionsDto: PageOptionsDto) {
        const page = await this.findAllUsersUseCase.findAll(pageOptionsDto);

        return {
            statusCode: 200,
            status: true,
            code: 'SUCCESS',
            message: 'Users retrieved successfully',
            data: page.data,
            meta: page.meta,
        };
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(ROLE.ADMIN_MASTER)
    @Post('create-admin')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Create an administrator user.' })
    @ApiBody({ type: CreateUserAdminDTO })
    @ApiEnvelopeResponse({
        status: 201,
        description: 'Administrator created successfully.',
        type: ResponseCreateUsersDto,
    })
    @ApiErrorEnvelopeResponse(400, 'Invalid Payload.', 'BAD_REQUEST', ['Username can contain lowercase letters, numbers and separators . _ - (without repeating or starting/ending with them)'])
    @ApiErrorEnvelopeResponse(403, 'Only ADMIN_MASTER can create administrators.', 'FORBIDDEN', 'Forbidden resource')
    @ApiErrorEnvelopeResponse(409, 'Email or username already registered.', 'CONFLICT', 'User already exists')
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
    @ApiOperation({ summary: 'Create a new public user.' })
    @ApiBody({ type: CreateUserDTO })
    @ApiEnvelopeResponse({
        status: 201,
        description: 'User created successfully.',
        type: ResponseCreateUsersDto,
    })
    @ApiErrorEnvelopeResponse(400, 'Invalid Paylod.', 'BAD_REQUEST', ['Invalid email address'])
    @ApiErrorEnvelopeResponse(409, 'Email or username already registered.', 'CONFLICT', 'User already exists')
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
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update users name and/or username.' })
    @ApiParam({ name: 'id', description: 'user UUID', example: '8f5c93d3-98bf-4a6a-b78d-6d0d10f74cc2' })
    @ApiBody({ type: UpdateUserDTO })
    @ApiEnvelopeResponse({
        status: 200,
        description: 'User updated successfully..',
        type: ResponseCreateUsersDto,
    })
    @ApiErrorEnvelopeResponse(400, 'Invalid payload or malformed id.', 'BAD_REQUEST', ['name should not be empty'])
    @ApiErrorEnvelopeResponse(403, 'User does not have permission to update this resource..', 'FORBIDDEN', 'Forbidden resource')
    @ApiErrorEnvelopeResponse(404, 'User not found.', 'NOT_FOUND', 'User not found')
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
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update the password of the authenticated user.' })
    @ApiParam({ name: 'id', description: 'User UUID', example: '8f5c93d3-98bf-4a6a-b78d-6d0d10f74cc2' })
    @ApiBody({ type: UpdatePasswordUserDTO })
    @ApiEnvelopeResponse({
        status: 200,
        description: 'Password updated successfully..',
    })
    @ApiErrorEnvelopeResponse(400, 'Invalid Payload.', 'BAD_REQUEST', ['The password must be at least 8 characters long and include uppercase, lowercase, number and symbol.'])
    @ApiErrorEnvelopeResponse(403, 'A user cannot change the password of another account..', 'FORBIDDEN', 'Forbidden resource')
    @ApiErrorEnvelopeResponse(404, 'User not found.', 'NOT_FOUND', 'User not found')
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
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Search for user by ID.' })
    @ApiParam({ name: 'id', description: 'User UUID', example: '8f5c93d3-98bf-4a6a-b78d-6d0d10f74cc2' })
    @ApiEnvelopeResponse({
        status: 200,
        description: 'User successfully recovered..',
        type: ResponseCreateUsersDto,
    })
    @ApiErrorEnvelopeResponse(403, 'User does not have permission to access this resource.', 'FORBIDDEN', 'Forbidden resource')
    @ApiErrorEnvelopeResponse(404, 'User not found.', 'NOT_FOUND', 'User not found')
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

    @UseGuards(JwtGuard)
    @Get('email/:email')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Search for user by email.' })
    @ApiParam({ name: 'email', description: 'Email do usuario', example: 'joao@email.com' })
    @ApiEnvelopeResponse({
        status: 200,
        description: 'User successfully recovered.',
        type: ResponseCreateUsersDto,
    })
    @ApiErrorEnvelopeResponse(403, 'Regular users can only check their own email.', 'FORBIDDEN', 'Forbidden resource')
    @ApiErrorEnvelopeResponse(404, 'User not found.', 'NOT_FOUND', 'User not found')
    async findByEmail(@Request() req: any, @Param('email') email: string) {
        const user = await this.findByEmailUseCase.findByEmail(email, req.user);

        return {
            statusCode: 200,
            status: true,
            code: 'SUCCESS',
            message: 'User retrieved successfully',
            data: user,
        };
    }

    @Get('username/:username')
    @ApiOperation({ summary: 'Search public user by username' })
    @ApiParam({ name: 'username', description: 'Username normalized to lowercase', example: 'joaovitor' })
    @ApiEnvelopeResponse({
        status: 200,
        description: 'User successfully recovered.',
        type: ResponseCreateUsersDto,
    })
    @ApiErrorEnvelopeResponse(404, 'User not found.', 'NOT_FOUND', 'User not found')
    async findByUsername(@Param('username') username: string) {
        const user = await this.findByUsernameUseCase.findByUsername(username);

        return {
            statusCode: 200,
            status: true,
            code: 'SUCCESS',
            message: 'User retrieved successfully',
            data: user,
        };
    }
}