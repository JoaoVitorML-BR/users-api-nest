import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsStrongPassword, MaxLength } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDTO {
    @ApiProperty({ example: 'joao@email.com', maxLength: 255 })
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim().toLowerCase())
    @IsEmail({}, { message: 'Invalid email address' })
    @MaxLength(255)
    email: string;
}

export class ResetPasswordDTO {
    @ApiProperty({ example: '2e5cb2c2-8f85-4b2e-8cf3-64dc61a1afdf' })
    @IsNotEmpty()
    token: string;
    
    @ApiProperty({
        example: 'NewPassword@123',
        minLength: 8,
        description: 'Minimum of 8 characters with uppercase, lowercase, number and symbol.',
    })
    @IsNotEmpty()
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    }, { message: 'The password must be at least 8 characters long and include uppercase, lowercase, number and symbol.' })
    newPassword: string;

    @ApiProperty({
        example: 'NewPassword@123',
        minLength: 8,
        description: 'Must be equal to the value sent in newPassword.',
    })
    @IsNotEmpty()
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    }, { message: 'The password must be at least 8 characters long and include uppercase, lowercase, number and symbol.' })
    confirmNewPassword: string;
};