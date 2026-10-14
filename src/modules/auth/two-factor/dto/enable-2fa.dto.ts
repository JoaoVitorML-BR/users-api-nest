import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class EnableTwoFactorDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit verification code from Authenticator App.',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  code: string;
}
