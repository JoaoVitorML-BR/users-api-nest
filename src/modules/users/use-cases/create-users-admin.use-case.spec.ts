import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { CreateUsersAdminUseCase } from './create-users-admin.use-case';
import { UserService } from '../user.service';
import { ROLE } from '../user.entity';
import { SendTokenUseCase } from '../email-confirmation/use-cases/send-token.use-case';

describe('CreateUsersAdminUseCase', () => {
  let useCase: CreateUsersAdminUseCase;

  const mockUserService = {
    create: jest.fn(),
    checkUserExistsByEmailAndUsername: jest.fn(),
  };

  const mockSendTokenUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUsersAdminUseCase,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: SendTokenUseCase,
          useValue: mockSendTokenUseCase,
        },
      ],
    }).compile();

    useCase = module.get<CreateUsersAdminUseCase>(CreateUsersAdminUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('createAdmin', () => {
    const validAdminData = {
      name: 'Admin Name',
      username: 'adminname',
      email: 'admin@test.com',
      password: 'Password123!',
    };

    it('should throw BadRequestException when required fields are missing', async () => {
      await expect(
        useCase.createAdmin({ name: '', username: '', email: '', password: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when user already exists', async () => {
      mockUserService.checkUserExistsByEmailAndUsername.mockResolvedValue(true);

      await expect(useCase.createAdmin(validAdminData)).rejects.toThrow(ConflictException);
      expect(mockUserService.create).not.toHaveBeenCalled();
    });

    it('should create admin user with ADMIN role and trigger token send', async () => {
      const createdUser = {
        id: '1',
        name: validAdminData.name,
        username: validAdminData.username,
        email: validAdminData.email,
        role: ROLE.ADMIN,
      };

      mockUserService.checkUserExistsByEmailAndUsername.mockResolvedValue(false);
      mockUserService.create.mockResolvedValue(createdUser);

      const result = await useCase.createAdmin(validAdminData);

      expect(mockUserService.create).toHaveBeenCalledWith({
        name: validAdminData.name,
        username: validAdminData.username,
        email: validAdminData.email,
        password: expect.any(String),
        role: ROLE.ADMIN,
      });
      expect(mockSendTokenUseCase.execute).toHaveBeenCalledWith({ email: createdUser.email });
      expect(result).toEqual(createdUser);
    });

    it('should throw InternalServerErrorException if create fails', async () => {
      mockUserService.checkUserExistsByEmailAndUsername.mockResolvedValue(false);
      mockUserService.create.mockResolvedValue(null);

      await expect(useCase.createAdmin(validAdminData)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
