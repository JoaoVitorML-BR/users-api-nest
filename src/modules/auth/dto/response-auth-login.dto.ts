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
  @ApiProperty({
    type: () => AuthenticatedUserResponseDto,
    required: false,
    nullable: true,
  })
  user?: AuthenticatedUserResponseDto | null;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.token',
    required: false,
    nullable: true,
  })
  accessToken?: string | null;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token',
    required: false,
    nullable: true,
  })
  refreshToken?: string | null;

  @ApiProperty({ example: 900, required: false, nullable: true })
  expiresIn?: number | null;

  @ApiProperty({ example: false, required: false })
  requires2FA?: boolean;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.2fa.token',
    required: false,
  })
  twoFactorToken?: string;
}
