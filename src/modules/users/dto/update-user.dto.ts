import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDTO {
    @ApiPropertyOptional({ example: 'Joao updated', minLength: 2, maxLength: 100 })
    @IsNotEmpty()
    @IsString({ message: 'Name must be a string' })
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({
        example: 'joao.updated',
        minLength: 5,
        maxLength: 15,
        description: 'It accepts lowercase letters, numbers, and separators. . _ -.',
    })
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