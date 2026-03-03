import { ROLE } from "src/modules/users/user.entity";

export interface JwtPayload {
    sub: string;
    username: string;
    email: string;
    role: ROLE;
    tokenType: 'access' | 'refresh';
}

export interface AuthenticatedUser {
    id: string;
    name: string;
    username: string;
    email: string;
    role: ROLE;
    isActive: boolean;
    emailConfirmed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
