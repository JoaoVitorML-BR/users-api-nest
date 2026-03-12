import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmEmailDto {
    @ApiProperty({ example: 'af40d7ec-2665-4db3-9291-2f1a1b05aa0d' })
    @IsString()
    @IsNotEmpty()
    token: string;
}