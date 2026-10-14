import { ApiProperty } from '@nestjs/swagger';

export class ResponseTwoFactorGenerateDto {
  @ApiProperty({
    example: 'JBSWY3DPEHPK3PXP',
    description:
      'Plaintext secret key to be manually entered in the authenticator app.',
  })
  secret: string;

  @ApiProperty({
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    description:
      'QR Code Data URL for instant scanning with Google Authenticator.',
  })
  qrCodeDataUrl: string;

  @ApiProperty({
    example:
      'otpauth://totp/PaymentApp:user@email.com?secret=JBSWY3DPEHPK3PXP&issuer=PaymentApp',
    description: 'Standard OTPAuth URI string.',
  })
  otpAuthUrl: string;
}
