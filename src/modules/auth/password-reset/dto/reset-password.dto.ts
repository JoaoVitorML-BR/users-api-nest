import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsStrongPassword, MaxLength } from "class-validator";

export class ForgotPasswordDTO {
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim().toLowerCase())
    @IsEmail({}, { message: 'Invalid email address' })
    @MaxLength(255)
    email: string;
}

export class ResetPasswordDTO {
    @IsNotEmpty()
    token: string;
    
    @IsNotEmpty()
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    }, { message: 'The password must be at least 8 characters long and include uppercase, lowercase, number and symbol.' })
    newPassword: string;

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