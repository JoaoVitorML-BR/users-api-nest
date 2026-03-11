import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UserService } from "../user.service";

@Injectable()
export class FindByIdUsersUseCase {
    constructor(
        private readonly userService: UserService
    ) { }

    async findById(id: string) {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        const user = await this.userService.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }
}