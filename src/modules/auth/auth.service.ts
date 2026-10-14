import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/user.service';
import { JwtService } from '@nestjs/jwt';
import { parseExpiresInToSeconds } from 'src/common/utils/time.util';
import {
  AuthenticatedUser,
  JwtPayload,
  TokenResponse,
} from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(
    user: Pick<AuthenticatedUser, 'id' | 'username' | 'email' | 'role'>,
  ): TokenResponse {
    const accessExpiresIn = parseExpiresInToSeconds(
      this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '1h'),
    );
    const refreshExpiresIn = parseExpiresInToSeconds(
      this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN', '7d'),
    );

    const accessPayload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      tokenType: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      tokenType: 'refresh',
    };

    return {
      accessToken: this.jwtService.sign(accessPayload, {
        expiresIn: accessExpiresIn,
      }),
      refreshToken: this.jwtService.sign(refreshPayload, {
        expiresIn: refreshExpiresIn,
      }),
      expiresIn: accessExpiresIn,
    };
  }

  generateTwoFactorPendingToken(
    user: Pick<AuthenticatedUser, 'id' | 'username' | 'email' | 'role'>,
  ): string {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      tokenType: '2fa_pending',
    };

    return this.jwtService.sign(payload, { expiresIn: 300 });
  }

  async validateUser(payload: JwtPayload): Promise<AuthenticatedUser | null> {
    if (payload.tokenType !== 'access') {
      return null;
    }

    const user = await this.userService.findById(payload.sub);
    if (!user || !user.isActive) {
      return null;
    }

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
