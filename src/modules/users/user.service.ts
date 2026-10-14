import {
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
} from 'src/common/utils/crypto.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository, UpdateResult } from 'typeorm';
import { PageOptionsDto } from './dto/page-options.dto';

import { ROLE } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userEntity: Repository<User>,
  ) {}
  async findAll(pageOptionsDto: PageOptionsDto) {
    try {
      return await this.userEntity.findAndCount({
        select: [
          'id',
          'name',
          'username',
          'email',
          'role',
          'isActive',
          'createdAt',
          'updatedAt',
        ],
        order: {
          createdAt: pageOptionsDto.order,
        },
        take: pageOptionsDto.take,
        skip: pageOptionsDto.skip,
      });
    } catch (_error) {
      throw new Error('Failed to fetch users');
    }
  }

  async findOne(id: string) {
    try {
      return await this.userEntity.findOne({ where: { id } });
    } catch (_error) {
      throw new Error('Failed to fetch user by id');
    }
  }

  async findByEmail(email: string) {
    try {
      return await this.userEntity.findOne({
        select: [
          'id',
          'name',
          'username',
          'email',
          'role',
          'isActive',
          'createdAt',
          'updatedAt',
        ],
        where: { email },
      });
    } catch (_error) {
      throw new Error('Failed to fetch user by email');
    }
  }

  async findByUsername(username: string) {
    try {
      return await this.userEntity.findOne({
        select: [
          'id',
          'name',
          'username',
          'email',
          'role',
          'isActive',
          'createdAt',
          'updatedAt',
        ],
        where: { username },
      });
    } catch (_error) {
      throw new Error('Failed to fetch user by username');
    }
  }

  async findById(id: string) {
    try {
      return await this.userEntity.findOne({
        select: [
          'id',
          'name',
          'username',
          'email',
          'role',
          'isActive',
          'createdAt',
          'updatedAt',
        ],
        where: { id },
      });
    } catch (_error) {
      throw new Error('Failed to fetch user by id');
    }
  }

  async findByIdWithPassword(id: string) {
    try {
      return await this.userEntity.findOne({
        select: [
          'id',
          'name',
          'username',
          'email',
          'role',
          'password',
          'isActive',
        ],
        where: { id },
      });
    } catch (_error) {
      throw new Error('Failed to fetch user with password');
    }
  }

  async findByIdForRefreshValidation(id: string) {
    try {
      return await this.userEntity.findOne({
        select: [
          'id',
          'name',
          'username',
          'email',
          'role',
          'refreshToken',
          'isActive',
        ],
        where: { id },
      });
    } catch (_error) {
      throw new Error('Failed to fetch auth user by id');
    }
  }

  async count() {
    try {
      return await this.userEntity.count();
    } catch (_error) {
      throw new Error('Failed to count users');
    }
  }

  async create(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: ROLE;
  }) {
    try {
      const user = this.userEntity.create({ ...data, role: data.role });
      const savedUser = await this.userEntity.save(user);
      const {
        password: _password,
        refreshToken: _refreshToken,
        ...safeUser
      } = savedUser;
      return safeUser;
    } catch (_error) {
      throw new Error('Failed to create user');
    }
  }

  async checkUserExistsByEmailAndUsername(email: string, username: string) {
    try {
      const user = await this.userEntity.findOne({
        select: ['id'],
        where: { email },
      });
      const userByUsername = await this.userEntity.findOne({
        where: { username },
      });
      return !!user || !!userByUsername;
    } catch (_error) {
      throw new Error('Failed to check user existence');
    }
  }

  async findByUsernameOrEmail(login: string) {
    try {
      return await this.userEntity.findOne({
        where: [{ username: login }, { email: login }],
      });
    } catch (_error) {
      throw new Error('Failed to fetch user by username or email');
    }
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    try {
      return await this.userEntity.update(userId, { refreshToken });
    } catch (_error) {
      throw new Error('Failed to update refresh token');
    }
  }

  async clearRefreshTokenIfPresent(userId: string): Promise<UpdateResult> {
    try {
      return await this.userEntity.update(
        { id: userId, refreshToken: Not(IsNull()) },
        { refreshToken: null },
      );
    } catch (_error) {
      throw new Error('Failed to clear refresh token');
    }
  }

  async update(id: string, data: Partial<{ name: string; username: string }>) {
    try {
      const updateResult = await this.userEntity.update(id, data);
      if (updateResult.affected === 0) {
        throw new NotFoundException('User not found');
      }

      const userUpdateResult = await this.userEntity.findOne({
        where: { id },
        select: ['id', 'name', 'username', 'role', 'isActive', 'updatedAt'],
      });
      return userUpdateResult;
    } catch (_error) {
      if (_error instanceof NotFoundException) {
        throw _error;
      }
      throw new Error('Failed to update user');
    }
  }

  async updatePassword(id: string, hashedPassword: string) {
    try {
      const updateResult = await this.userEntity.update(id, {
        password: hashedPassword,
      });
      if (updateResult.affected === 0) {
        throw new NotFoundException('User not found');
      }
      return true;
    } catch (_error) {
      if (_error instanceof NotFoundException) {
        throw _error;
      }
      throw new Error('Failed to update password');
    }
  }

  async findByIdWithTwoFactorSecret(id: string) {
    try {
      const user = await this.userEntity.findOne({
        where: { id },
        select: [
          'id',
          'name',
          'username',
          'email',
          'role',
          'isActive',
          'isTwoFactorEnabled',
          'twoFactorSecret',
          'password',
        ],
      });

      if (user && user.twoFactorSecret) {
        user.twoFactorSecret = decryptTwoFactorSecret(user.twoFactorSecret);
      }

      return user;
    } catch (_error) {
      throw new Error('Failed to fetch user with 2FA secret');
    }
  }

  async setTwoFactor(
    userId: string,
    isEnabled: boolean,
    secret: string | null,
  ) {
    try {
      const encryptedSecret = secret ? encryptTwoFactorSecret(secret) : null;
      const updateResult = await this.userEntity.update(userId, {
        isTwoFactorEnabled: isEnabled,
        twoFactorSecret: encryptedSecret,
      });
      if (updateResult.affected === 0) {
        throw new NotFoundException('User not found');
      }
      return true;
    } catch (_error) {
      if (_error instanceof NotFoundException) {
        throw _error;
      }
      throw new Error('Failed to update two factor authentication status');
    }
  }
}
