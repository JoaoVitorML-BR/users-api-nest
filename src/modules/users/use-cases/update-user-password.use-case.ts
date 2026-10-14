import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { authenticator } from 'otplib';
import { UpdatePasswordUserDTO } from '../dto/update-password-user.dto';
import { UserService } from '../user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UpdatePasswordUseCase {
  constructor(private userService: UserService) {}
  private readonly logger = new Logger(UpdatePasswordUseCase.name);

  async updatePassword(
    data: UpdatePasswordUserDTO,
    id: string,
    loggedUserId: string,
  ) {
    if (loggedUserId !== id) {
      this.logger.warn(
        `Password change attempt: user ${loggedUserId} tried to change password for user ${id}`,
      );
      throw new ForbiddenException('You can only change your own password');
    }

    const user = await this.userService.findByIdWithTwoFactorSecret(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isTwoFactorEnabled) {
      if (!data.twoFactorCode) {
        this.logger.warn(
          `Password change rejected: 2FA code required but not provided for user ${id}`,
        );
        throw new BadRequestException(
          'Two-factor authentication code is required',
        );
      }

      if (!user.twoFactorSecret) {
        this.logger.warn(
          `Password change rejected: 2FA enabled but no secret found for user ${id}`,
        );
        throw new BadRequestException(
          'Two-factor authentication is misconfigured. Please contact support.',
        );
      }

      const isCodeValid = authenticator.verify({
        token: data.twoFactorCode,
        secret: user.twoFactorSecret,
      });

      if (!isCodeValid) {
        this.logger.warn(
          `Password change rejected: invalid 2FA code for user ${id}`,
        );
        throw new BadRequestException('Invalid two-factor authentication code');
      }
    }

    const isPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      this.logger.warn(
        `Password change failed: incorrect current password for user ${id}`,
      );
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
