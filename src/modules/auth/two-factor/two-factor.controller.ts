import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtGuard } from '../guards/jwt.guard';
import { AuthenticatedUser } from '../types/auth.types';
import { TwoFactorService } from './two-factor.service';
import { EnableTwoFactorDto } from './dto/enable-2fa.dto';
import { DisableTwoFactorDto } from './dto/disable-2fa.dto';
import { VerifyTwoFactorDto } from './dto/verify-2fa.dto';
import { ResponseTwoFactorGenerateDto } from './dto/response-2fa-generate.dto';
import { ResponseAuthLoginDTO } from '../dto/response-auth-login.dto';
import {
  ApiEnvelopeResponse,
  ApiErrorEnvelopeResponse,
} from 'src/common/swagger/api-envelope-response.decorator';

@ApiTags('Two Factor Auth')
@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Post('generate')
  @ApiOperation({ summary: 'Generate TOTP secret and QR code for 2FA setup.' })
  @ApiEnvelopeResponse({
    status: HttpStatus.OK,
    description: '2FA secret and QR code generated successfully.',
    type: ResponseTwoFactorGenerateDto,
  })
  @ApiErrorEnvelopeResponse(
    HttpStatus.UNAUTHORIZED,
    'Missing or invalid token.',
    'UNAUTHORIZED',
    'Unauthorized',
  )
  async generate(@Req() req: Request & { user: AuthenticatedUser }) {
    const data = await this.twoFactorService.generateSecret(req.user);

    return {
      statusCode: HttpStatus.OK,
      status: true,
      code: 'SUCCESS',
      message: '2FA secret generated successfully',
      data,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Post('enable')
  @ApiOperation({
    summary: 'Enable two-factor authentication after verifying initial code.',
  })
  @ApiBody({ type: EnableTwoFactorDto })
  @ApiEnvelopeResponse({
    status: HttpStatus.OK,
    description: '2FA enabled successfully.',
  })
  @ApiErrorEnvelopeResponse(
    HttpStatus.BAD_REQUEST,
    'Invalid 2FA code.',
    'BAD_REQUEST',
    'Invalid two factor verification code',
  )
  async enable(
    @Req() req: Request & { user: AuthenticatedUser },
    @Body() dto: EnableTwoFactorDto,
  ) {
    await this.twoFactorService.enableTwoFactor(req.user, dto);

    return {
      statusCode: HttpStatus.OK,
      status: true,
      code: 'SUCCESS',
      message: 'Two factor authentication enabled successfully',
      data: null,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Post('disable')
  @ApiOperation({
    summary: 'Disable two-factor authentication with password and code.',
  })
  @ApiBody({ type: DisableTwoFactorDto })
  @ApiEnvelopeResponse({
    status: HttpStatus.OK,
    description: '2FA disabled successfully.',
  })
  @ApiErrorEnvelopeResponse(
    HttpStatus.BAD_REQUEST,
    'Invalid payload or code.',
    'BAD_REQUEST',
    'Invalid two factor verification code',
  )
  async disable(
    @Req() req: Request & { user: AuthenticatedUser },
    @Body() dto: DisableTwoFactorDto,
  ) {
    await this.twoFactorService.disableTwoFactor(req.user, dto);

    return {
      statusCode: HttpStatus.OK,
      status: true,
      code: 'SUCCESS',
      message: 'Two factor authentication disabled successfully',
      data: null,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('verify')
  @ApiOperation({
    summary: 'Verify 2FA TOTP code during login and return full auth tokens.',
  })
  @ApiBody({ type: VerifyTwoFactorDto })
  @ApiEnvelopeResponse({
    status: HttpStatus.OK,
    description: '2FA verification successful, tokens issued.',
    type: ResponseAuthLoginDTO,
  })
  @ApiErrorEnvelopeResponse(
    HttpStatus.UNAUTHORIZED,
    'Invalid or expired 2FA code/token.',
    'UNAUTHORIZED',
    'Invalid two factor verification code',
  )
  async verify(@Body() dto: VerifyTwoFactorDto) {
    const data = await this.twoFactorService.verifyTwoFactor(dto);

    return {
      statusCode: HttpStatus.OK,
      status: true,
      code: 'SUCCESS',
      message: 'Two factor verification successful',
      data,
    };
  }
}
