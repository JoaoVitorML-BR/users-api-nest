import { BadRequestException, Injectable } from "@nestjs/common";
import { EmailConfirmationService } from "../email-confirmation.service";

@Injectable()
export class ActivateAccountUseCase {
    constructor(
        private readonly emailConfirmationService: EmailConfirmationService,
    ) { }

    async execute(token: string): Promise<void> {
        if (!token) {
            throw new BadRequestException('Token is required to activate the account.');
        }

        await this.emailConfirmationService.activateAccount(token);
    }
}