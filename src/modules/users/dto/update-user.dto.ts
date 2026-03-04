import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class UpdateUserDTO {
    @IsNotEmpty()
    @IsString({ message: 'Name must be a string' })
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @IsNotEmpty()
    @IsString({ message: 'Username must be a string' })
    @MinLength(5)
    @MaxLength(15)
    @Transform(({ value }) => value?.trim().toLowerCase())
    @Matches(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, {
        message: 'Username can contain lowercase letters, numbers and separators . _ - (without repeating or starting/ending with them)',
    })
    username?: string;
};