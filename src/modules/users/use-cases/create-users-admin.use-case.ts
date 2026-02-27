import { CreateUserAdminDTO } from "../dto/create-users.dto";
import { ApiResponseDto } from "../dto/api-response.dto";
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { ROLE } from "../user.entity";

import * as bcrypt from 'bcrypt';
import { UserService } from "../user.service";
import { ResponseCreateUsersDto } from "../dto/response-create-users.dto";

@Injectable()
export class CreateUsersAdminUseCase {
    constructor(
        private readonly userService: UserService
    ) { }

    async createAdmin(Data: CreateUserAdminDTO): Promise<ApiResponseDto<ResponseCreateUsersDto>> {
        try {
            if (!Data.name || !Data.email || !Data.password || !Data.username) {
                throw new BadRequestException("Name, username, email and password are required");
            }

            const userExists = await this.userService.checkUserExistsByEmailAndUsername(Data.email, Data.username);
            if (userExists) {
                throw new ConflictException('User with the same email or username already exists');
            }

            const hashedPassword = await bcrypt.hash(Data.password, 10);

            const res = await this.userService.create({ ...Data, password: hashedPassword, role: ROLE.ADMIN });
            if (!res || !res.id) {
                throw new InternalServerErrorException('Failed to create user');
            }

            return {
                statusCode: 201,
                code: "SUCCESS",
                status: true,
                message: "Admin user created successfully"
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof ConflictException || error instanceof InternalServerErrorException) {
                throw error;
            }
            throw new InternalServerErrorException('Unexpected error while creating admin user');
        }
    }
}