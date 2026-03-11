import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { UserService } from "../user.service";
import { CreateUserDTO } from "../dto/create-users.dto";

import * as bcrypt from 'bcrypt';

import { ROLE } from "../user.entity";
import { SendTokenUseCase } from "../email-confirmation/use-cases/send-token.use-case";
import { ResponseCreateUsersDto } from "../dto/response-create-users.dto";

@Injectable()
export class CreateUsersUseCase {
    constructor(
        private readonly userService: UserService,
        private readonly sendTokenUseCase: SendTokenUseCase
    ) { }

    async create(Data: CreateUserDTO): Promise<ResponseCreateUsersDto> {

        if (!Data.name || !Data.email || !Data.password || !Data.username) {
            throw new BadRequestException("Name, username, email and password are required");
        }

        const hashedPassword = await bcrypt.hash(Data.password, 10);

        const userCount = await this.userService.count();

        if (userCount === 0) {
            const user = await this.userService.create({ ...Data, password: hashedPassword, role: ROLE.ADMIN_MASTER });

            if (!user || !user.id) {
                throw new InternalServerErrorException("Failed to create user");
            }

            this.sendTokenUseCase.execute({ email: user.email });

            return user;
        }

        const userExists = await this.userService.checkUserExistsByEmailAndUsername(Data.email, Data.username);

        if (userExists) {
            throw new ConflictException('User with the same email or username already exists');
        }

        const res = await this.userService.create({ ...Data, password: hashedPassword, role: ROLE.USER });
        if (!res || !res.id) {
            throw new InternalServerErrorException('Failed to create user');
        }

        this.sendTokenUseCase.execute({ email: res.email });

        return res;
    }
}