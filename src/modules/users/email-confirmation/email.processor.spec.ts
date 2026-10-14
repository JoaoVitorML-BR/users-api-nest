import { Test, TestingModule } from '@nestjs/testing';
import { EmailConfirmationProcessor } from './email.processor';
import { SendTokenFromEmailService } from 'src/common/services/send-email-token.service';

describe('EmailConfirmationProcessor', () => {
  let processor: EmailConfirmationProcessor;
  let sendTokenFromEmailService: SendTokenFromEmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailConfirmationProcessor,
        {
          provide: SendTokenFromEmailService,
          useValue: {
            sendToken: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<EmailConfirmationProcessor>(
      EmailConfirmationProcessor,
    );
    sendTokenFromEmailService = module.get<SendTokenFromEmailService>(
      SendTokenFromEmailService,
    );
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should complete job when email is sent successfully', async () => {
    (sendTokenFromEmailService.sendToken as jest.Mock).mockResolvedValue(true);

    const job = {
      id: 'job-1',
      data: {
        email: 'test@example.com',
        token: '123456',
        type: 'email-confirmation',
        userName: 'Test User',
      },
    } as any;

    await expect(processor.handleSendEmail(job)).resolves.not.toThrow();
    expect(sendTokenFromEmailService.sendToken).toHaveBeenCalledWith(
      'test@example.com',
      '123456',
      'email-confirmation',
      'Test User',
    );
  });

  it('should throw Error when email sending fails so Bull can retry', async () => {
    (sendTokenFromEmailService.sendToken as jest.Mock).mockResolvedValue(false);

    const job = {
      id: 'job-2',
      data: {
        email: 'fail@example.com',
        token: '123456',
        type: 'email-confirmation',
      },
    } as any;

    await expect(processor.handleSendEmail(job)).rejects.toThrow(
      'Email sending failed for fail@example.com',
    );
  });
});
