import { Test, TestingModule } from '@nestjs/testing';
import { FindAllUsersUseCase } from './find-all-users.use-case';
import { UserService } from '../user.service';
import { InternalServerErrorException } from '@nestjs/common';
import { ROLE } from '../user.entity';

describe('FindAllUsersUseCase', () => {
  let useCase: FindAllUsersUseCase;
  let userService: UserService;

  const mockUserService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllUsersUseCase,
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    useCase = module.get<FindAllUsersUseCase>(FindAllUsersUseCase);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users successfully', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'John Doe',
          username: 'john123',
          email: 'john@test.com',
          role: ROLE.USER,
          isActive: true,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        },
        {
          id: '2',
          name: 'Jane Doe',
          username: 'jane123',
          email: 'jane@test.com',
          role: ROLE.ADMIN_MASTER,
          isActive: true,
          createdAt: new Date('2024-02-01T00:00:00.000Z'),
          updatedAt: new Date('2024-02-02T00:00:00.000Z'),
        },
      ];

      mockUserService.findAll.mockResolvedValue(mockUsers);

      const result = await useCase.findAll();

      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 'SUCCESS',
        statusCode: 200,
        status: true,
        message: 'Users retrieved successfully',
        data: mockUsers,
      });
    });

    it('should return empty array when no users exist', async () => {
      mockUserService.findAll.mockResolvedValue([]);

      const result = await useCase.findAll();

      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 'SUCCESS',
        statusCode: 200,
        status: true,
        message: 'Users retrieved successfully',
        data: [],
      });
    });

    it('should throw InternalServerErrorException if findAll returns null', async () => {
      mockUserService.findAll.mockResolvedValue(null);

      await expect(useCase.findAll()).rejects.toThrow(InternalServerErrorException);
      await expect(useCase.findAll()).rejects.toThrow('Failed to retrieve users');
    });

    it('should throw InternalServerErrorException if findAll returns undefined', async () => {
      mockUserService.findAll.mockResolvedValue(undefined);

      await expect(useCase.findAll()).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle service errors', async () => {
      mockUserService.findAll.mockRejectedValue(new Error('Database error'));

      await expect(useCase.findAll()).rejects.toThrow('Database error');
    });
  });
});
