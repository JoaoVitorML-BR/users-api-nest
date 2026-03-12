import { IsEmail, IsNotEmpty } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
    @ApiProperty({ example: 'joao@email.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}