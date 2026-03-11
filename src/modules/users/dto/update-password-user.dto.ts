import { IsNotEmpty, IsStrongPassword } from "class-validator";

export class UpdatePasswordUserDTO {
    @IsNotEmpty()
    currentPassword: string;

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
}