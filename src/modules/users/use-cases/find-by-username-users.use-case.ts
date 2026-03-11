import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UserService } from "../user.service";

@Injectable()
export class FindByUsernameUsersUseCase {
    constructor(private readonly userService: UserService) { }

    async findByUsername(username: string) {
        if (!username) {
            throw new BadRequestException('Username is required');
        }

        const normalizedUsername = username.trim().toLowerCase();
        const user = await this.userService.findByUsername(normalizedUsername);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }
}
