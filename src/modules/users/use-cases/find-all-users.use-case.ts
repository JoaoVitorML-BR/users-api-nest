import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { UserService } from "../user.service";
import { FindAllUsersResponseDto } from "../dto/find-all-uses-response.dto";

@Injectable()
export class FindAllUsersUseCase {
    constructor(private readonly userService: UserService) { }

    async findAll(): Promise<FindAllUsersResponseDto[]> {
        const res = await this.userService.findAll();

        if (!res) {
            throw new InternalServerErrorException('Failed to retrieve users');
        }

        return res;
    }
}