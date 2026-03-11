import { Test, TestingModule } from '@nestjs/testing';
import { CreateUsersUseCase } from './create-users.use-case';
import { UserService } from '../user.service';
import { BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { ROLE } from '../user.entity';
import { SendTokenUseCase } from '../email-confirmation/use-cases/send-token.use-case';

describe('CreateUsersUseCase', () => {
  let useCase: CreateUsersUseCase;
  let userService: UserService;
  let sendTokenUseCase: SendTokenUseCase;

  const mockUserService = {
    count: jest.fn(),
    create: jest.fn(),
    checkUserExistsByEmailAndUsername: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUsersUseCase,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: SendTokenUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get<CreateUsersUseCase>(CreateUsersUseCase);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('create', () => {
    const validUserData = {
      name: 'John Doe',
      username: 'john123',
      email: 'john@test.com',
      password: 'password123',
    };

    it('should throw BadRequestException if required fields are missing', async () => {
      const invalidData = { name: '', username: '', email: '', password: '' };

      await expect(useCase.create(invalidData)).rejects.toThrow(BadRequestException);
      await expect(useCase.create(invalidData)).rejects.toThrow('Name, username, email and password are required');
    });

    it('should create first user with ADMIN_MASTER role', async () => {
      const mockCreatedUser = { id: '1', name: validUserData.name, username: validUserData.username, email: validUserData.email, role: ROLE.ADMIN_MASTER };
      mockUserService.count.mockResolvedValue(0);
      mockUserService.create.mockResolvedValue(mockCreatedUser);

      const result = await useCase.create(validUserData);

      expect(mockUserService.count).toHaveBeenCalledTimes(1);
      expect(mockUserService.create).toHaveBeenCalledWith({
        name: validUserData.name,
        username: validUserData.username,
        email: validUserData.email,
        password: expect.any(String),
        role: ROLE.ADMIN_MASTER,
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it('should throw InternalServerErrorException if first user creation fails', async () => {
      mockUserService.count.mockResolvedValue(0);
      mockUserService.create.mockResolvedValue(null);

      await expect(useCase.create(validUserData)).rejects.toThrow(InternalServerErrorException);
      await expect(useCase.create(validUserData)).rejects.toThrow('Failed to create user');
    });

    it('should throw InternalServerErrorException if first user has no id', async () => {
      mockUserService.count.mockResolvedValue(0);
      mockUserService.create.mockResolvedValue({});

      await expect(useCase.create(validUserData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUserService.count.mockResolvedValue(1);
      mockUserService.checkUserExistsByEmailAndUsername.mockResolvedValue(true);

      await expect(useCase.create(validUserData)).rejects.toThrow(ConflictException);
      await expect(useCase.create(validUserData)).rejects.toThrow('User with the same email or username already exists');
    });

    it('should create user with USER role when not first user', async () => {
      const mockCreatedUser = { id: '2', name: validUserData.name, username: validUserData.username, email: validUserData.email, role: ROLE.USER };
      mockUserService.count.mockResolvedValue(1);
      mockUserService.checkUserExistsByEmailAndUsername.mockResolvedValue(false);
      mockUserService.create.mockResolvedValue(mockCreatedUser);

      const result = await useCase.create(validUserData);

      expect(mockUserService.count).toHaveBeenCalledTimes(1);
      expect(mockUserService.checkUserExistsByEmailAndUsername).toHaveBeenCalledWith(
        validUserData.email,
        validUserData.username,
      );
      expect(mockUserService.create).toHaveBeenCalledWith({
        name: validUserData.name,
        username: validUserData.username,
        email: validUserData.email,
        password: expect.any(String),
        role: ROLE.USER,
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it('should throw InternalServerErrorException if regular user creation fails', async () => {
      mockUserService.count.mockResolvedValue(1);
      mockUserService.checkUserExistsByEmailAndUsername.mockResolvedValue(false);
      mockUserService.create.mockResolvedValue(null);

      await expect(useCase.create(validUserData)).rejects.toThrow(InternalServerErrorException);
      await expect(useCase.create(validUserData)).rejects.toThrow('Failed to create user');
    });

    it('should throw InternalServerErrorException if created user has no id', async () => {
      mockUserService.count.mockResolvedValue(1);
      mockUserService.checkUserExistsByEmailAndUsername.mockResolvedValue(false);
      mockUserService.create.mockResolvedValue({});

      await expect(useCase.create(validUserData)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
