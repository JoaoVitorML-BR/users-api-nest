import { IsEmail, IsNotEmpty } from "class-validator";

export class SendEmailConfirmationDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;
};