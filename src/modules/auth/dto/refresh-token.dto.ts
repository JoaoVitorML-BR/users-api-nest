import { IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token',
        minLength: 20,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(20)
    refreshToken: string;
}