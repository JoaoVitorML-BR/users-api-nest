import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyTwoFactorDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'Temporary 2FA token returned by login endpoint when 2FA is required.',
  })
  @IsNotEmpty()
  @IsString()
  twoFactorToken: string;

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
