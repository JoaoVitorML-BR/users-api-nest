import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class SendEmailDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    token: string;
}