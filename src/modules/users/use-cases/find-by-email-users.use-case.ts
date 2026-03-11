import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ROLE } from "../user.entity";
import { UserService } from "../user.service";

type LoggedUser = {
    id: string;
    email: string;
    role: ROLE;
};

@Injectable()
export class FindByEmailUsersUseCase {
    constructor(private readonly userService: UserService) { }

    async findByEmail(email: string, loggedUser: LoggedUser) {
        if (!email) {
            throw new BadRequestException('Email is required');
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedLoggedEmail = loggedUser?.email?.trim().toLowerCase();

        const isAdmin =
            loggedUser?.role === ROLE.ADMIN_MASTER ||
            loggedUser?.role === ROLE.ADMIN;

        if (!isAdmin && normalizedLoggedEmail !== normalizedEmail) {
            throw new ForbiddenException('You can only access your own email data');
        }

        const user = await this.userService.findByEmail(normalizedEmail);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }
}
