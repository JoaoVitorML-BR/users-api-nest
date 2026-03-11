import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from '../user.service';
import { FindByUsernameUsersUseCase } from './find-by-username-users.use-case';

describe('FindByUsernameUsersUseCase', () => {
  let useCase: FindByUsernameUsersUseCase;

  const mockUserService = {
    findByUsername: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindByUsernameUsersUseCase,
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    useCase = module.get<FindByUsernameUsersUseCase>(FindByUsernameUsersUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('findByUsername', () => {
    it('should throw BadRequestException when username is missing', async () => {
      await expect(useCase.findByUsername('')).rejects.toThrow(BadRequestException);
    });

    it('should return user by username', async () => {
      const user = {
        id: '1',
        name: 'John Doe',
        username: 'john123',
        email: 'john@test.com',
      };

      mockUserService.findByUsername.mockResolvedValue(user);

      const result = await useCase.findByUsername('John123');

      expect(mockUserService.findByUsername).toHaveBeenCalledWith('john123');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when username does not exist', async () => {
      mockUserService.findByUsername.mockResolvedValue(null);

      await expect(useCase.findByUsername('missinguser')).rejects.toThrow(NotFoundException);
    });
  });
});
