import { ApiProperty } from '@nestjs/swagger';

class AuthenticatedUserResponseDto {
    @ApiProperty({ example: '8f5c93d3-98bf-4a6a-b78d-6d0d10f74cc2' })
    id: string;

    @ApiProperty({ example: 'Joao Vitor' })
    name: string;

    @ApiProperty({ example: 'joaovitor' })
    username: string;

    @ApiProperty({ example: 'joao@email.com' })
    email: string;

    @ApiProperty({ example: 'user' })
    role: string;
}

export class ResponseAuthLoginDTO {
    @ApiProperty({ type: () => AuthenticatedUserResponseDto })
    user: AuthenticatedUserResponseDto;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.token' })
    accessToken: string;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token' })
    refreshToken: string;

    @ApiProperty({ example: 900 })
    expiresIn: number;
}