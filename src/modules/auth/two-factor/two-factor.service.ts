import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/modules/users/user.service';
import { AuthService } from '../auth.service';
import { AuthenticatedUser, JwtPayload } from '../types/auth.types';
import { EnableTwoFactorDto } from './dto/enable-2fa.dto';
import { DisableTwoFactorDto } from './dto/disable-2fa.dto';
import { VerifyTwoFactorDto } from './dto/verify-2fa.dto';
import { ResponseTwoFactorGenerateDto } from './dto/response-2fa-generate.dto';
import { ResponseAuthLoginDTO } from '../dto/response-auth-login.dto';
import { hashRefreshToken } from '../utils/refresh-token.util';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateSecret(
    user: Pick<AuthenticatedUser, 'id' | 'email'>,
  ): Promise<ResponseTwoFactorGenerateDto> {
    const secret = authenticator.generateSecret();
    const appName = this.configService.get<string>('APP_NAME', 'PaymentAPI');
    const otpAuthUrl = authenticator.keyuri(user.email, appName, secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

    // Save the secret in the database (2FA still disabled until /enable is called)
    await this.userService.setTwoFactor(user.id, false, secret);

    this.logger.log(`2FA secret generated and stored for user: ${user.id}`);

    return {
      secret,
      qrCodeDataUrl,
      otpAuthUrl,
    };
  }

  async enableTwoFactor(
    user: Pick<AuthenticatedUser, 'id'>,
    dto: EnableTwoFactorDto,
  ): Promise<void> {
    // Retrieve the pending secret from the database instead of trusting the client
    const fullUser = await this.userService.findByIdWithTwoFactorSecret(
      user.id,
    );

    if (!fullUser || !fullUser.twoFactorSecret) {
      this.logger.warn(
        `2FA enablement failed: no pending secret found for user id ${user.id}. Call /generate first.`,
      );
      throw new BadRequestException(
        'No pending 2FA secret found. Please generate a secret first.',
      );
    }

    if (fullUser.isTwoFactorEnabled) {
      throw new BadRequestException(
        'Two factor authentication is already enabled',
      );
    }

    const isValid = authenticator.verify({
      token: dto.code,
      secret: fullUser.twoFactorSecret,
    });

    if (!isValid) {
      this.logger.warn(
        `2FA enablement failed: invalid code for user id ${user.id}`,
      );
      throw new BadRequestException('Invalid two factor verification code');
    }

    await this.userService.setTwoFactor(
      user.id,
      true,
      fullUser.twoFactorSecret,
    );
    this.logger.log(`2FA enabled successfully for user id ${user.id}`);
  }

  async disableTwoFactor(
    user: Pick<AuthenticatedUser, 'id'>,
    dto: DisableTwoFactorDto,
  ): Promise<void> {
    const fullUser = await this.userService.findByIdWithTwoFactorSecret(
      user.id,
    );
    if (
      !fullUser ||
      !fullUser.isTwoFactorEnabled ||
      !fullUser.twoFactorSecret
    ) {
      this.logger.warn(
        `2FA disable failed: 2FA not enabled for user id ${user.id}`,
      );
      throw new BadRequestException('Two factor authentication is not enabled');
    }

    const isPasswordMatch = await bcrypt.compare(
      dto.password,
      fullUser.password,
    );
    if (!isPasswordMatch) {
      this.logger.warn(
        `2FA disable failed: invalid password for user id ${user.id}`,
      );
      throw new UnauthorizedException('Invalid credentials or password');
    }

    const isValid = authenticator.verify({
      token: dto.code,
      secret: fullUser.twoFactorSecret,
    });

    if (!isValid) {
      this.logger.warn(
        `2FA disable failed: invalid TOTP code for user id ${user.id}`,
      );
      throw new BadRequestException('Invalid two factor verification code');
    }

    await this.userService.setTwoFactor(user.id, false, null);
    this.logger.log(`2FA disabled successfully for user id ${user.id}`);
  }

  async verifyTwoFactor(
    dto: VerifyTwoFactorDto,
  ): Promise<ResponseAuthLoginDTO> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.twoFactorToken,
      );
    } catch (_error) {
      this.logger.warn(
        '2FA verification rejected: invalid or expired 2FA pending token',
      );
      throw new UnauthorizedException('Invalid or expired 2FA token');
    }

    if (payload.tokenType !== '2fa_pending') {
      this.logger.warn(
        `2FA verification rejected: invalid token type for user id ${payload.sub}`,
      );
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userService.findByIdWithTwoFactorSecret(
      payload.sub,
    );
    if (
      !user ||
      !user.isActive ||
      !user.isTwoFactorEnabled ||
      !user.twoFactorSecret
    ) {
      this.logger.warn(
        `2FA verification rejected: user inactive or 2FA not enabled ${payload.sub}`,
      );
      throw new UnauthorizedException('User not found or 2FA not enabled');
    }

    const isValid = authenticator.verify({
      token: dto.code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      this.logger.warn(
        `2FA verification failed: invalid code for user id ${user.id}`,
      );
      throw new UnauthorizedException('Invalid two factor verification code');
    }

    const {
      password: _password,
      twoFactorSecret: _twoFactorSecret,
      ...userWithoutSensitiveData
    } = user;

    const tokens = this.authService.generateAccessToken(
      userWithoutSensitiveData,
    );
    const hashedRefreshToken = hashRefreshToken(tokens.refreshToken);
    await this.userService.updateRefreshToken(user.id, hashedRefreshToken);

    this.logger.log(`2FA login verification successful for user id ${user.id}`);

    return {
      user: {
        id: userWithoutSensitiveData.id,
        name: userWithoutSensitiveData.name,
        username: userWithoutSensitiveData.username,
        email: userWithoutSensitiveData.email,
        role: userWithoutSensitiveData.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      requires2FA: false,
    };
  }
}
