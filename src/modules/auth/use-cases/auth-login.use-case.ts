import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/modules/users/user.service';
import { SignInDto } from '../dto/sign-in.dto';

import * as bcrypt from 'bcrypt';
import { ResponseAuthLoginDTO } from '../dto/response-auth-login.dto';

import { AuthService } from '../auth.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtService } from '@nestjs/jwt';
import {
  AuthenticatedUser,
  JwtPayload,
  TokenResponse,
} from '../types/auth.types';
import {
  compareRefreshToken,
  hashRefreshToken,
} from '../utils/refresh-token.util';

@Injectable()
export class AuthSignInUseCase {
  private readonly logger = new Logger(AuthSignInUseCase.name);

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<ResponseAuthLoginDTO> {
    const { login, password } = signInDto;
    this.logger.debug(`Login attempt for user: ${login}`);

    if (!login || !password) {
      this.logger.warn(`Login rejected due to missing credentials: ${login}`);
      throw new UnauthorizedException(
        'username or email with password are required',
      );
    }

    const userExists = await this.userService.findByUsernameOrEmail(login);
    if (!userExists) {
      this.logger.warn(`Login failed: user not found for login ${login}`);
      throw new UnauthorizedException('User incorrect');
    }

    const passwordMatch = await bcrypt.compare(password, userExists.password);
    if (!passwordMatch) {
      this.logger.warn(
        `Login failed: invalid password for user id ${userExists.id}`,
      );
      throw new UnauthorizedException('Invalid credentials or password');
    }

    if (!userExists.isActive || !userExists.emailConfirmed) {
      this.logger.warn(
        `Login rejected: inactive or unconfirmed email for user id ${userExists.id}`,
      );
      throw new UnauthorizedException(
        'Account is not activated. Please verify your email.',
      );
    }

    const {
      password: _password,
      twoFactorSecret: _twoFactorSecret,
      ...userWithoutPassword
    } = userExists;

    if (userExists.isTwoFactorEnabled) {
      this.logger.log(`2FA required for login of user id ${userExists.id}`);
      const twoFactorToken =
        this.authService.generateTwoFactorPendingToken(userWithoutPassword);

      return {
        requires2FA: true,
        twoFactorToken,
        user: null,
        accessToken: null,
        refreshToken: null,
        expiresIn: null,
      };
    }

    const tokens = this.authService.generateAccessToken(userWithoutPassword);
    const hashedRefreshToken = hashRefreshToken(tokens.refreshToken);

    await this.userService.updateRefreshToken(
      userWithoutPassword.id,
      hashedRefreshToken,
    );
    this.logger.log(`Login successful for user id ${userWithoutPassword.id}`);

    return {
      user: {
        id: userWithoutPassword.id,
        name: userWithoutPassword.name,
        username: userWithoutPassword.username,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      requires2FA: false,
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<TokenResponse> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refreshToken,
      );

      if (payload.tokenType !== 'refresh') {
        this.logger.warn(
          `Refresh token rejected: wrong token type for user id ${payload.sub}`,
        );
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userService.findByIdForRefreshValidation(
        payload.sub,
      );
      if (!user || !user.isActive) {
        this.logger.warn(
          `Refresh token rejected: user inactive or not found ${payload.sub}`,
        );
        throw new UnauthorizedException('User not found or inactive');
      }

      const isValidRefreshToken = compareRefreshToken(
        dto.refreshToken,
        user.refreshToken,
      );

      if (!isValidRefreshToken) {
        this.logger.warn(
          `Refresh token rejected: hash mismatch for user id ${user.id}`,
        );
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = this.authService.generateAccessToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      const hashedRefreshToken = hashRefreshToken(tokens.refreshToken);
      await this.userService.updateRefreshToken(user.id, hashedRefreshToken);
      this.logger.log(`Refresh token rotated for user id ${user.id}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      };
    } catch (_error) {
      this.logger.warn(
        'Refresh token flow failed due to invalid/expired token',
      );
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(user: Pick<AuthenticatedUser, 'id'>): Promise<void> {
    const userId = user?.id;

    if (!userId) {
      this.logger.warn('Logout rejected: user not found in request context');
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.userService.clearRefreshTokenIfPresent(userId);
    this.logger.log(`Logout successful for user id ${userId}`);
  }
}
