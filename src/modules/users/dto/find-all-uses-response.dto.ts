import { ApiProperty } from '@nestjs/swagger';

export class FindAllUsersResponseDto {
    @ApiProperty({ example: '8f5c93d3-98bf-4a6a-b78d-6d0d10f74cc2' })
    id: string;

    @ApiProperty({ example: 'Joao Vitor' })
    name: string;

    @ApiProperty({ example: 'joao@email.com' })
    email: string;

    @ApiProperty({ example: 'admin' })
    role: string;
}