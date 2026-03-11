import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class SignInDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    @Matches(/^\S+$/, { message: 'Login must not contain spaces' })
    @Transform(({ value }) => value?.trim())
    login: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(128)
    password: string;
}