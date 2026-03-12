import { Test, TestingModule } from '@nestjs/testing';
import { FindAllUsersUseCase } from './find-all-users.use-case';
import { UserService } from '../user.service';
import { InternalServerErrorException } from '@nestjs/common';
import { ROLE } from '../user.entity';
import { PageOptionsDto } from '../dto/page-options.dto';

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
      const pageOptionsDto: PageOptionsDto = {
        order: undefined,
        page: 1,
        take: 10,
        skip: 0,
      };
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

      mockUserService.findAll.mockResolvedValue([mockUsers, 2]);

      const result = await useCase.findAll(pageOptionsDto);

      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
      expect(mockUserService.findAll).toHaveBeenCalledWith(pageOptionsDto);
      expect(result).toEqual({
        data: mockUsers,
        meta: {
          page: 1,
          take: 10,
          itemCount: 2,
          pageCount: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      });
    });

    it('should return empty array when no users exist', async () => {
      const pageOptionsDto: PageOptionsDto = {
        order: undefined,
        page: 1,
        take: 10,
        skip: 0,
      };
      mockUserService.findAll.mockResolvedValue([[], 0]);

      const result = await useCase.findAll(pageOptionsDto);

      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        data: [],
        meta: {
          page: 1,
          take: 10,
          itemCount: 0,
          pageCount: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      });
    });

    it('should throw InternalServerErrorException if findAll returns null', async () => {
      const pageOptionsDto: PageOptionsDto = {
        order: undefined,
        page: 1,
        take: 10,
        skip: 0,
      };
      mockUserService.findAll.mockResolvedValue([null, 0]);

      await expect(useCase.findAll(pageOptionsDto)).rejects.toThrow(InternalServerErrorException);
      await expect(useCase.findAll(pageOptionsDto)).rejects.toThrow('Failed to retrieve users');
    });

    it('should throw InternalServerErrorException if findAll returns undefined', async () => {
      const pageOptionsDto: PageOptionsDto = {
        order: undefined,
        page: 1,
        take: 10,
        skip: 0,
      };
      mockUserService.findAll.mockResolvedValue([undefined, 0]);

      await expect(useCase.findAll(pageOptionsDto)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle service errors', async () => {
      const pageOptionsDto: PageOptionsDto = {
        order: undefined,
        page: 1,
        take: 10,
        skip: 0,
      };
      mockUserService.findAll.mockRejectedValue(new Error('Database error'));

      await expect(useCase.findAll(pageOptionsDto)).rejects.toThrow('Database error');
    });
  });
});
