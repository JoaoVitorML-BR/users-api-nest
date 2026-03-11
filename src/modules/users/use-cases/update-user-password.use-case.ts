import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { UpdatePasswordUserDTO } from "../dto/update-password-user.dto";
import { UserService } from "../user.service";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UpdatePasswordUseCase {
    constructor(private userService: UserService) { }
    private readonly logger = new Logger(UpdatePasswordUseCase.name);

    async updatePassword(data: UpdatePasswordUserDTO, id: string, loggedUserId: string) {
        if (loggedUserId !== id) {
            this.logger.warn(`Password change attempt: user ${loggedUserId} tried to change password for user ${id}`);
            throw new ForbiddenException('You can only change your own password');
        }

        const user = await this.userService.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
        if (!isPasswordValid) {
            this.logger.warn(`Password change failed: incorrect current password for user ${id}`);
            throw new BadRequestException('Current password is incorrect');
        }

        if (data.newPassword !== data.confirmNewPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        const newPasswordHash = await bcrypt.hash(data.newPassword, 10);
        await this.userService.updatePassword(id, newPasswordHash);

        this.logger.log(`Password updated successfully for user ${id}`);
        return true;
    }
}