import { Injectable } from "@nestjs/common";
import { randomBytes } from 'crypto';

@Injectable()
export class TokenGeneratorService {
    generate(length: number = 8): string {
        return randomBytes(length).toString('hex').slice(0, length);
    }
}