import { Injectable } from "@nestjs/common";
import { User } from "./user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository, UpdateResult } from "typeorm";

import { ROLE } from "./user.entity";

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private readonly userEntity: Repository<User>) { }
    async findAll() {
        return this.userEntity.find({
            select: ['id', 'name', 'username', 'email', 'role', 'isActive', 'createdAt', 'updatedAt']
        });
    };

    async findOne(id: string) {
        return this.userEntity.findOne({ where: { id } });
    }

    async findByEmail(email: string) {
        return this.userEntity.findOne({ where: { email } });
    }

    async findByUsername(username: string) {
        return this.userEntity.findOne({ where: { username } });
    }

    async findById(id: string) {
        return this.userEntity.findOne({ where: { id } });
    }

    async count() {
        return this.userEntity.count();
    }

    async create(data: { name: string, username: string, email: string, password: string, role: ROLE }) {
        const user = this.userEntity.create({ ...data, role: data.role });
        return this.userEntity.save(user);
    }

    async checkUserExistsByEmailAndUsername(email: string, username: string) {
        const user = await this.userEntity.findOne({ where: { email } });
        const userByUsername = await this.userEntity.findOne({ where: { username } });
        return !!user || !!userByUsername;
    }

    async findByUsernameOrEmail(login: string) {
        return this.userEntity.findOne({ where: [{ username: login }, { email: login }] });
    }

    async updateRefreshToken(userId: string, refreshToken: string | null) {
        return await this.userEntity.update(userId, { refreshToken });
    }

    async clearRefreshTokenIfPresent(userId: string): Promise<UpdateResult> {
        return this.userEntity.update(
            { id: userId, refreshToken: Not(IsNull()) },
            { refreshToken: null }
        );
    }
};