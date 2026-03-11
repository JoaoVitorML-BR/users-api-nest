import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { UserService } from "../user.service";
import { UpdateUserDTO } from "../dto/update-user.dto";

@Injectable()
export class UpdateUserUseCase {
    constructor(private readonly userService: UserService) { }
    private readonly logger = new Logger(UpdateUserUseCase.name);
    async update(Data: UpdateUserDTO, id: string) {
        if (!Data.name && !Data.username) {
            this.logger.warn(`Update rejected: no fields provided for update for user id ${id}`);
            throw new BadRequestException('At least one field (name or username) must be provided for update.');
        }

        if (!id) {
            this.logger.warn(`Update rejected: no ID provided for update`);
            throw new BadRequestException('User ID is required for update.');
        }

        const userExists = await this.userService.findById(id);
        if (!userExists) {
            this.logger.warn(`Update failed: user not found for id ${id}`);
            throw new NotFoundException('User not found with the provided ID.');
        }

        const updatedUser = await this.userService.update(id, Data);
        if (!updatedUser) {
            this.logger.error(`Update failed: unable to update user with id ${id}`);
            throw new BadRequestException('Failed to update user. No changes were made.');
        }

        return updatedUser;
    }
}