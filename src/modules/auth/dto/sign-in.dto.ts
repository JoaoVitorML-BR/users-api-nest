import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
    @ApiProperty({
        example: 'joaovitor',
        description: 'Accept username or email, without spaces.',
        minLength: 3,
        maxLength: 255,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    @Matches(/^\S+$/, { message: 'Login must not contain spaces' })
    @Transform(({ value }) => value?.trim())
    login: string;

    @ApiProperty({ example: 'Password@123', minLength: 8, maxLength: 128 })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(128)
    password: string;
}