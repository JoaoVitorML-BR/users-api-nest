import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseCreateUsersDto {
    @ApiProperty({ example: '8f5c93d3-98bf-4a6a-b78d-6d0d10f74cc2' })
    id: string;

    @ApiProperty({ example: 'Joao Vitor' })
    name: string;

    @ApiProperty({ example: 'joaovitor' })
    username: string;

    @ApiProperty({ example: 'joao@email.com' })
    email: string;

    @ApiPropertyOptional({ example: 'user' })
    role?: string;

    @ApiPropertyOptional({ example: false })
    isActive?: boolean;

    @ApiPropertyOptional({ example: '2026-03-12T09:00:00.000Z' })
    createdAt?: Date;

    @ApiPropertyOptional({ example: '2026-03-12T09:10:00.000Z' })
    updatedAt?: Date;
}