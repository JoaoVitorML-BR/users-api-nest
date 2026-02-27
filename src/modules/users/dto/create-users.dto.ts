import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDTO {
    @IsNotEmpty()
    @IsString({ message: 'Name must be a string' })
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsNotEmpty()
    @IsString({ message: 'Username must be a string' })
    @MinLength(5)
    @MaxLength(15)
    @Transform(({ value }) => value?.trim().toLowerCase())
    @Matches(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, {
        message: 'Username pode ter letras minúsculas, números e separadores . _ - (sem repetir ou começar/terminar com eles)',
    })
    username: string;

    @IsNotEmpty()
    @Transform(({ value }) => value?.trim().toLowerCase())
    @IsEmail({}, { message: 'Invalid email address' })
    @MaxLength(255)
    email: string;

    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    }, { message: 'The password must be at least 8 characters long and include uppercase, lowercase, number and symbol.' })
    password: string;
}

export class CreateUserAdminDTO extends CreateUserDTO { }