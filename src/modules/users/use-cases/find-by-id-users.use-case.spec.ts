import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FindByIdUsersUseCase } from './find-by-id-users.use-case';
import { UserService } from '../user.service';

describe('FindByIdUsersUseCase', () => {
  let useCase: FindByIdUsersUseCase;

  const mockUserService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindByIdUsersUseCase,
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    useCase = module.get<FindByIdUsersUseCase>(FindByIdUsersUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('findById', () => {
    it('should throw BadRequestException when id is missing', async () => {
      await expect(useCase.findById('')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserService.findById.mockResolvedValue(null);

      await expect(useCase.findById('1')).rejects.toThrow(NotFoundException);
      expect(mockUserService.findById).toHaveBeenCalledWith('1');
    });

    it('should return user when found', async () => {
      const user = {
        id: '1',
        name: 'John Doe',
        username: 'john123',
        email: 'john@test.com',
      };
      mockUserService.findById.mockResolvedValue(user);

      const result = await useCase.findById('1');

      expect(mockUserService.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(user);
    });
  });
});
