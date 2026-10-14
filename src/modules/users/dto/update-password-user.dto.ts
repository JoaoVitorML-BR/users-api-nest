import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePasswordUserDTO {
  @ApiProperty({ example: 'CurrentPassword@123' })
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: 'NewPassword@123',
    minLength: 8,
    description:
      'Minimum of 8 characters including uppercase, lowercase, numbers, and symbols.',
  })
  @IsNotEmpty()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'The password must be at least 8 characters long and include uppercase, lowercase, number and symbol.',
    },
  )
  newPassword: string;

  @ApiProperty({
    example: 'NewPassword@123',
    minLength: 8,
    description: 'It must be equal to the value sent in newPassword.',
  })
  @IsNotEmpty()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'The password must be at least 8 characters long and include uppercase, lowercase, number and symbol.',
    },
  )
  confirmNewPassword: string;

  @ApiPropertyOptional({
    example: '123456',
    description:
      'Required only when Two-Factor Authentication is enabled. 6-digit code from the Authenticator App.',
    minLength: 6,
    maxLength: 6,
  })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  twoFactorCode?: string;
}
