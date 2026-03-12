import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { User, ROLE } from './user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order, PageOptionsDto } from './dto/page-options.dto';

describe('UserService', () => {
  let service: UserService;

  const mockRepository = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users with count', async () => {
      const pageOptionsDto: PageOptionsDto = {
        order: Order.ASC,
        page: 1,
        take: 10,
        skip: 0,
      };
      const mockUsers = [
        { id: '1', name: 'John', email: 'john@test.com', username: 'john123', role: ROLE.USER },
        { id: '2', name: 'Jane', email: 'jane@test.com', username: 'jane123', role: ROLE.USER },
      ];
      mockRepository.findAndCount.mockResolvedValue([mockUsers, 2]);

      const result = await service.findAll(pageOptionsDto);

      expect(result).toEqual([mockUsers, 2]);
      expect(mockRepository.findAndCount).toHaveBeenCalledTimes(1);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        select: ['id', 'name', 'username', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
        order: {
          createdAt: Order.ASC,
        },
        take: 10,
        skip: 0,
      });
    });

    it('should return empty array when no users exist', async () => {
      const pageOptionsDto: PageOptionsDto = {
        order: Order.ASC,
        page: 1,
        take: 10,
        skip: 0,
      };
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(pageOptionsDto);

      expect(result).toEqual([[], 0]);
      expect(mockRepository.findAndCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: '1', name: 'John', email: 'john@test.com', username: 'john123' };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should return null when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('999');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = { id: '1', email: 'john@test.com' };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('john@test.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        select: ['id', 'name', 'username', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
        where: { email: 'john@test.com' },
      });
    });
  });

  describe('findByUsername', () => {
    it('should return a user by username', async () => {
      const mockUser = { id: '1', username: 'john123' };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername('john123');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        select: ['id', 'name', 'username', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
        where: { username: 'john123' },
      });
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: '1', name: 'John' };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        select: ['id', 'name', 'username', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
        where: { id: '1' },
      });
    });
  });

  describe('count', () => {
    it('should return the count of users', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.count();

      expect(result).toBe(5);
      expect(mockRepository.count).toHaveBeenCalledTimes(1);
    });

    it('should return 0 when no users exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.count();

      expect(result).toBe(0);
    });
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const userData = {
        name: 'John',
        username: 'john123',
        email: 'john@test.com',
        password: 'password123',
        role: ROLE.USER,
      };
      const mockEntity = {
        id: '1',
        name: userData.name,
        username: userData.username,
        email: userData.email,
        role: userData.role,
      };
      const mockSavedUser = {
        ...mockEntity,
        password: 'hashed-password',
        refreshToken: null,
      };

      mockRepository.create.mockReturnValue(mockEntity);
      mockRepository.save.mockResolvedValue(mockSavedUser);

      const result = await service.create(userData);

      expect(result).toEqual(mockEntity);
      expect(mockRepository.create).toHaveBeenCalledWith(userData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockEntity);
    });

    it('should create user with ADMIN_MASTER role', async () => {
      const userData = {
        name: 'Admin',
        username: 'admin',
        email: 'admin@test.com',
        password: 'admin123',
        role: ROLE.ADMIN_MASTER,
      };
      const mockEntity = {
        id: '1',
        name: userData.name,
        username: userData.username,
        email: userData.email,
        role: userData.role,
      };
      const mockSavedUser = {
        ...mockEntity,
        password: 'hashed-password',
        refreshToken: null,
      };

      mockRepository.create.mockReturnValue(mockEntity);
      mockRepository.save.mockResolvedValue(mockSavedUser);

      const result = await service.create(userData);

      expect(result).toEqual(mockEntity);
      expect(mockRepository.create).toHaveBeenCalledWith(userData);
    });
  });

  describe('checkUserExistsByEmailAndUsername', () => {
    it('should return true if user exists by email', async () => {
      const mockUser = { id: '1', email: 'john@test.com' };
      mockRepository.findOne
        .mockResolvedValueOnce(mockUser) // first call for email
        .mockResolvedValueOnce(null); // second call for username

      const result = await service.checkUserExistsByEmailAndUsername('john@test.com', 'john123');

      expect(result).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should return true if user exists by username', async () => {
      const mockUser = { id: '1', username: 'john123' };
      mockRepository.findOne
        .mockResolvedValueOnce(null) // first call for email
        .mockResolvedValueOnce(mockUser); // second call for username

      const result = await service.checkUserExistsByEmailAndUsername('john@test.com', 'john123');

      expect(result).toBe(true);
    });

    it('should return false if user does not exist', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await service.checkUserExistsByEmailAndUsername('john@test.com', 'john123');

      expect(result).toBe(false);
    });
  });

  describe('clearRefreshTokenIfPresent', () => {
    it('should clear refresh token if present', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.clearRefreshTokenIfPresent('123');

      expect(mockRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: '123' }),
        { refreshToken: null }
      );
      expect(result).toEqual({ affected: 1 });
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const mockUpdateResult = { affected: 1 };
      const mockUpdatedUser = { id: '1', name: 'John Updated', username: 'johnupdated', role: ROLE.USER, isActive: true, updatedAt: new Date() };
      mockRepository.update.mockResolvedValue(mockUpdateResult);
      mockRepository.findOne.mockResolvedValue(mockUpdatedUser);
      const result = await service.update('1', { name: 'John Updated', username: 'johnupdated' });

      expect(result).toEqual(mockUpdatedUser);
      expect(mockRepository.update).toHaveBeenCalledWith('1', { name: 'John Updated', username: 'johnupdated' });
    });

    it('should throw error if user not found', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('1', { name: 'John Updated', username: 'johnupdated' })).rejects.toThrow('User not found');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const mockUpdateResult = { affected: 1 };
      mockRepository.update.mockResolvedValue(mockUpdateResult);
      const result = await service.updatePassword('1', 'newhashedpassword');
      expect(result).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith('1', { password: 'newhashedpassword' });
    });

    it('should throw error if user not found', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 });
      await expect(service.updatePassword('1', 'newhashedpassword')).rejects.toThrow('User not found');
    });
  });
});
