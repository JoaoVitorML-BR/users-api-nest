import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class RefreshTokenDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(20)
    refreshToken: string;
}