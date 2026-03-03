import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { UserService } from "../user.service";
import { ApiResponseDto } from "../dto/api-response.dto";
import { FindAllUsersResponseDto } from "../dto/find-all-uses-response.dto";

@Injectable()
export class FindAllUsersUseCase {
    constructor(private readonly userService: UserService) { }

    async findAll(): Promise<ApiResponseDto<FindAllUsersResponseDto[]>> {
        const res = await this.userService.findAll();

        if (!res) {
            throw new InternalServerErrorException('Failed to retrieve users');
        }

        return {
            statusCode: 200,
            status: true,
            code: 'SUCCESS',
            message: 'Users retrieved successfully',
            data: res,
        }
    }
}