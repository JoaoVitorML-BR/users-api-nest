export class ResponseCreateUsersDto {
    id: string;
    name: string;
    username: string;
    email: string;
    role?: string;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}