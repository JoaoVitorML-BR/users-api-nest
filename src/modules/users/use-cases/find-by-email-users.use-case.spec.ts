import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ROLE } from '../user.entity';
import { UserService } from '../user.service';
import { FindByEmailUsersUseCase } from './find-by-email-users.use-case';

describe('FindByEmailUsersUseCase', () => {
  let useCase: FindByEmailUsersUseCase;

  const mockUserService = {
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindByEmailUsersUseCase,
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    useCase = module.get<FindByEmailUsersUseCase>(FindByEmailUsersUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('findByEmail', () => {
    const normalUser = {
      id: '1',
      email: 'john@test.com',
      role: ROLE.USER,
    };

    it('should throw BadRequestException when email is missing', async () => {
      await expect(useCase.findByEmail('', normalUser)).rejects.toThrow(BadRequestException);
    });

    it('should allow normal user to find only own email', async () => {
      const user = {
        id: '1',
        name: 'John Doe',
        username: 'john123',
        email: 'john@test.com',
      };

      mockUserService.findByEmail.mockResolvedValue(user);

      const result = await useCase.findByEmail('john@test.com', normalUser);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith('john@test.com');
      expect(result).toEqual(user);
    });

    it('should reject normal user trying to access another email', async () => {
      await expect(useCase.findByEmail('other@test.com', normalUser)).rejects.toThrow(ForbiddenException);
      expect(mockUserService.findByEmail).not.toHaveBeenCalled();
    });

    it('should allow admin to find any email', async () => {
      const adminUser = {
        id: '2',
        email: 'admin@test.com',
        role: ROLE.ADMIN,
      };
      const user = {
        id: '1',
        name: 'John Doe',
        username: 'john123',
        email: 'john@test.com',
      };

      mockUserService.findByEmail.mockResolvedValue(user);

      const result = await useCase.findByEmail('john@test.com', adminUser);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith('john@test.com');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when email does not exist', async () => {
      const adminMaster = {
        id: '3',
        email: 'master@test.com',
        role: ROLE.ADMIN_MASTER,
      };

      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(useCase.findByEmail('missing@test.com', adminMaster)).rejects.toThrow(NotFoundException);
    });
  });
});
