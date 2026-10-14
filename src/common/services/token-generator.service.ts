import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class TokenGeneratorService {
  generate(length: number = 32): string {
    const bytesNeeded = Math.ceil(length / 2);
    return randomBytes(bytesNeeded).toString('hex').slice(0, length);
  }
}
