import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDTO {
    @ApiProperty({ example: 'Joao Vitor', minLength: 2, maxLength: 100 })
    @IsNotEmpty()
    @IsString({ message: 'Name must be a string' })
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @ApiProperty({
        example: 'joaovitor',
        minLength: 5,
        maxLength: 15,
        description: 'Accept lowercase letters, numbers and separators . _ -.',
    })
    @IsNotEmpty()
    @IsString({ message: 'Username must be a string' })
    @MinLength(5)
    @MaxLength(15)
    @Transform(({ value }) => value?.trim().toLowerCase())
    @Matches(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, {
        message: 'Username can contain lowercase letters, numbers and separators . _ - (without repeating or starting/ending with them)',
    })
    username: string;

    @ApiProperty({ example: 'joao@email.com', maxLength: 255 })
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim().toLowerCase())
    @IsEmail({}, { message: 'Invalid email address' })
    @MaxLength(255)
    email: string;

    @ApiProperty({
        example: 'Password@123',
        minLength: 8,
        description: 'Minimum of 8 characters with uppercase, lowercase, number and symbol.',
    })
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