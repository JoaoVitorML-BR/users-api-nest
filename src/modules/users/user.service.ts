import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { User } from "./user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository, UpdateResult } from "typeorm";

import { ROLE } from "./user.entity";

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private readonly userEntity: Repository<User>) { }
    async findAll() {
        try {
            return await this.userEntity.find({
                select: ['id', 'name', 'username', 'email', 'role', 'isActive', 'createdAt', 'updatedAt']
            });
        } catch (error) {
            throw new Error('Failed to fetch users');
        }
    }

    async findOne(id: string) {
        try {
            return await this.userEntity.findOne({ where: { id } });
        } catch (error) {
            throw new Error('Failed to fetch user by id');
        }
    }

    async findByEmail(email: string) {
        try {
            return await this.userEntity.findOne({
                select: ['id', 'name', 'username', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
                where: { email }
            });
        } catch (error) {
            throw new Error('Failed to fetch user by email');
        }
    }

    async findByUsername(username: string) {
        try {
            return await this.userEntity.findOne({
                select: ['id', 'name', 'username', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
                where: { username }
            });
        } catch (error) {
            throw new Error('Failed to fetch user by username');
        }
    }

    async findById(id: string) {
        try {
            return await this.userEntity.findOne({
                select: ['id', 'name', 'username', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
                where: { id }
            });
        } catch (error) {
            throw new Error('Failed to fetch user by id');
        }
    }

    async count() {
        try {
            return await this.userEntity.count();
        } catch (error) {
            throw new Error('Failed to count users');
        }
    }

    async create(data: { name: string, username: string, email: string, password: string, role: ROLE }) {
        try {
            const user = this.userEntity.create({ ...data, role: data.role });
            const savedUser = await this.userEntity.save(user);
            const { password, refreshToken, ...safeUser } = savedUser;
            return safeUser;
        } catch (error) {
            throw new Error('Failed to create user');
        }
    }

    async checkUserExistsByEmailAndUsername(email: string, username: string) {
        try {
            const user = await this.userEntity.findOne({ select: ['id'], where: { email } });
            const userByUsername = await this.userEntity.findOne({ where: { username } });
            return !!user || !!userByUsername;
        } catch (error) {
            throw new Error('Failed to check user existence');
        }
    }

    async findByUsernameOrEmail(login: string) {
        try {
            return await this.userEntity.findOne({ where: [{ username: login }, { email: login }] });
        } catch (error) {
            throw new Error('Failed to fetch user by username or email');
        }
    }

    async updateRefreshToken(userId: string, refreshToken: string | null) {
        try {
            return await this.userEntity.update(userId, { refreshToken });
        } catch (error) {
            throw new Error('Failed to update refresh token');
        }
    }

    async clearRefreshTokenIfPresent(userId: string): Promise<UpdateResult> {
        try {
            return await this.userEntity.update(
                { id: userId, refreshToken: Not(IsNull()) },
                { refreshToken: null }
            );
        } catch (error) {
            throw new Error('Failed to clear refresh token');
        }
    }

    async update(id: string, data: Partial<{ name: string, username: string }>) {
        try {
            const updateResult = await this.userEntity.update(id, data);
            if (updateResult.affected === 0) {
                throw new NotFoundException('User not found');
            }

            const userUpdateResult = await this.userEntity.findOne(
                {
                    where: { id },
                    select: ['id', 'name', 'username', 'role', 'isActive', 'updatedAt']
                });
            return userUpdateResult;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new Error('Failed to update user');
        }
    }

    async updatePassword(id: string, hashedPassword: string) {
        try {
            const updateResult = await this.userEntity.update(id, { password: hashedPassword });
            if (updateResult.affected === 0) {
                throw new NotFoundException('User not found');
            }
            return true;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new Error('Failed to update password');
        }
    }
};