import { Injectable } from "@nestjs/common";

@Injectable()
export class TokenGeneratorService {
    generate(length: number = 8): string {
        try {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let token = '';
            for (let i = 0; i < length; i++) {
                token += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return token;
        } catch (error) {
            throw new Error('Failed to generate token');
        }
    }
}