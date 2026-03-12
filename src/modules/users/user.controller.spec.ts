import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { FindAllUsersUseCase } from './use-cases/find-all-users.use-case';
import { CreateUsersUseCase } from './use-cases/create-users.use-case';
import { CreateUsersAdminUseCase } from './use-cases/create-users-admin.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { UpdatePasswordUseCase } from './use-cases/update-user-password.use-case';
import { FindByIdUsersUseCase } from './use-cases/find-by-id-users.use-case';
import { FindByEmailUsersUseCase } from './use-cases/find-by-email-users.use-case';
import { FindByUsernameUsersUseCase } from './use-cases/find-by-username-users.use-case';
import { ROLE } from './user.entity';
import { AuthorizationGuard } from '../auth/guards/authorization.guard';
import { UserService } from './user.service';
import { PageOptionsDto } from './dto/page-options.dto';

describe('UserController', () => {
  let controller: UserController;
  let findAllUsersUseCase: FindAllUsersUseCase;
  let createUsersUseCase: CreateUsersUseCase;
  let createUsersAdminUseCase: CreateUsersAdminUseCase;
  let updateUserUseCase: UpdateUserUseCase;
  let updatePasswordUseCase: UpdatePasswordUseCase;
  let findByIdUsersUseCase: FindByIdUsersUseCase;
  let findByEmailUsersUseCase: FindByEmailUsersUseCase;
  let findByUsernameUsersUseCase: FindByUsernameUsersUseCase;

  const mockFindAllUsersUseCase = {
    findAll: jest.fn(),
  };

  const mockCreateUsersUseCase = {
    create: jest.fn(),
  };

  const mockCreateUsersAdminUseCase = {
    createAdmin: jest.fn(),
  };

  const mockUpdateUserUseCase = {
    update: jest.fn(),
  };

  const mockUpdatePasswordUseCase = {
    updatePassword: jest.fn(),
  };

  const mockFindByIdUsersUseCase = {
    findById: jest.fn(),
  };

  const mockFindByEmailUsersUseCase = {
    findByEmail: jest.fn(),
  };

  const mockFindByUsernameUsersUseCase = {
    findByUsername: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: FindAllUsersUseCase,
          useValue: mockFindAllUsersUseCase,
        },
        {
          provide: CreateUsersUseCase,
          useValue: mockCreateUsersUseCase,
        },
        {
          provide: CreateUsersAdminUseCase,
          useValue: mockCreateUsersAdminUseCase,
        },
        {
          provide: UpdateUserUseCase,
          useValue: mockUpdateUserUseCase,
        },
        {
          provide: UpdatePasswordUseCase,
          useValue: mockUpdatePasswordUseCase,
        },
        {
          provide: FindByIdUsersUseCase,
          useValue: mockFindByIdUsersUseCase,
        },
        {
          provide: FindByEmailUsersUseCase,
          useValue: mockFindByEmailUsersUseCase,
        },
        {
          provide: FindByUsernameUsersUseCase,
          useValue: mockFindByUsernameUsersUseCase,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: AuthorizationGuard,
          useValue: {
            canActivate: jest.fn(() => true),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    findAllUsersUseCase = module.get<FindAllUsersUseCase>(FindAllUsersUseCase);
    createUsersUseCase = module.get<CreateUsersUseCase>(CreateUsersUseCase);
    createUsersAdminUseCase = module.get<CreateUsersAdminUseCase>(CreateUsersAdminUseCase);
    updateUserUseCase = module.get<UpdateUserUseCase>(UpdateUserUseCase);
    updatePasswordUseCase = module.get<UpdatePasswordUseCase>(UpdatePasswordUseCase);
    findByIdUsersUseCase = module.get<FindByIdUsersUseCase>(FindByIdUsersUseCase);
    findByEmailUsersUseCase = module.get<FindByEmailUsersUseCase>(FindByEmailUsersUseCase);
    findByUsernameUsersUseCase = module.get<FindByUsernameUsersUseCase>(FindByUsernameUsersUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const pageOptionsDto: PageOptionsDto = {
        order: undefined,
        page: 1,
        take: 10,
        skip: 0,
      };
      const paginatedUsers = {
        data: [
          {
            id: '1',
            name: 'John Doe',
            username: 'john123',
            email: 'john@test.com',
            role: ROLE.USER,
          },
          {
            id: '2',
            name: 'Jane Doe',
            username: 'jane123',
            email: 'jane@test.com',
            role: ROLE.ADMIN_MASTER,
          },
        ],
        meta: {
          page: 1,
          take: 10,
          itemCount: 2,
          pageCount: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      };

      mockFindAllUsersUseCase.findAll.mockResolvedValue(paginatedUsers);

      const result = await controller.findAll(pageOptionsDto);

      expect(findAllUsersUseCase.findAll).toHaveBeenCalledTimes(1);
      expect(findAllUsersUseCase.findAll).toHaveBeenCalledWith(pageOptionsDto);
      expect(result).toEqual({
        statusCode: 200,
        status: true,
        code: 'SUCCESS',
        message: 'Users retrieved successfully',
        data: paginatedUsers.data,
        meta: paginatedUsers.meta,
      });
    });

    it('should return empty array when no users exist', async () => {
      const pageOptionsDto: PageOptionsDto = {
        order: undefined,
        page: 1,
        take: 10,
        skip: 0,
      };
      mockFindAllUsersUseCase.findAll.mockResolvedValue({
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

      const result = await controller.findAll(pageOptionsDto);

      expect(result).toEqual({
        statusCode: 200,
        status: true,
        code: 'SUCCESS',
        message: 'Users retrieved successfully',
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
      expect(result.data).toHaveLength(0);
    });

    it('should propagate errors from use case', async () => {
      const error = new Error('Database error');
      mockFindAllUsersUseCase.findAll.mockRejectedValue(error);

      const pageOptionsDto: PageOptionsDto = {
        order: undefined,
        page: 1,
        take: 10,
        skip: 0,
      };
      await expect(controller.findAll(pageOptionsDto)).rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    const validUserData = {
      name: 'John Doe',
      username: 'john123',
      email: 'john@test.com',
      password: 'password123',
    };

    it('should create a new user', async () => {
      const mockCreatedUser = {
        id: '1',
        name: validUserData.name,
        username: validUserData.username,
        email: validUserData.email,
        role: ROLE.USER,
      };

      mockCreateUsersUseCase.create.mockResolvedValue(mockCreatedUser);

      const result = await controller.create(validUserData);

      expect(createUsersUseCase.create).toHaveBeenCalledTimes(1);
      expect(createUsersUseCase.create).toHaveBeenCalledWith(validUserData);
      expect(result).toEqual({
        statusCode: 201,
        status: true,
        code: 'CREATED',
        message: 'User created successfully',
        data: mockCreatedUser,
      });
    });

    it('should create first user with ADMIN_MASTER role', async () => {
      const mockCreatedUser = {
        id: '1',
        name: validUserData.name,
        username: validUserData.username,
        email: validUserData.email,
        role: ROLE.ADMIN_MASTER,
      };

      mockCreateUsersUseCase.create.mockResolvedValue(mockCreatedUser);

      const result = await controller.create(validUserData);

      expect(result.data).toBeDefined();
      expect(result.data?.role).toBe(ROLE.ADMIN_MASTER);
    });

    it('should propagate BadRequestException from use case', async () => {
      const error = new Error('Name, username, email and password are required');
      mockCreateUsersUseCase.create.mockRejectedValue(error);

      await expect(controller.create({ name: '', username: '', email: '', password: '' })).rejects.toThrow(
        'Name, username, email and password are required',
      );
    });

    it('should propagate ConflictException from use case', async () => {
      const error = new Error('User with the same email or username already exists');
      mockCreateUsersUseCase.create.mockRejectedValue(error);

      await expect(controller.create(validUserData)).rejects.toThrow(
        'User with the same email or username already exists',
      );
    });
  });

  describe('createAdmin', () => {
    const validAdminData = {
      name: 'Admin User',
      username: 'adminuser',
      email: 'admin@test.com',
      password: 'password123',
    };

    it('should create admin user and wrap response in controller', async () => {
      const mockCreatedAdmin = {
        id: '10',
        name: validAdminData.name,
        username: validAdminData.username,
        email: validAdminData.email,
        role: ROLE.ADMIN,
      };
      mockCreateUsersAdminUseCase.createAdmin.mockResolvedValue(mockCreatedAdmin);

      const result = await controller.createAdmin(validAdminData);

      expect(createUsersAdminUseCase.createAdmin).toHaveBeenCalledWith(validAdminData);
      expect(result).toEqual({
        statusCode: 201,
        status: true,
        code: 'CREATED',
        message: 'Admin user created successfully',
        data: mockCreatedAdmin,
      });
    });
  });

  describe('update', () => {
    it('should update user and return wrapped response', async () => {
      const updateData = { name: 'John Updated', username: 'johnupdated' };
      const updatedUser = {
        id: '1',
        ...updateData,
        role: ROLE.USER,
        isActive: true,
      };
      mockUpdateUserUseCase.update.mockResolvedValue(updatedUser);

      const result = await controller.update(updateData, '1');

      expect(updateUserUseCase.update).toHaveBeenCalledWith(updateData, '1');
      expect(result).toEqual({
        statusCode: 200,
        status: true,
        code: 'SUCCESS',
        message: 'User updated successfully',
        data: updatedUser,
      });
    });
  });

  describe('updatePassword', () => {
    it('should update password and return success envelope', async () => {
      const request = { user: { id: '1' } };
      const payload = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmNewPassword: 'NewPass123!',
      };
      mockUpdatePasswordUseCase.updatePassword.mockResolvedValue(true);

      const result = await controller.updatePassword(request, payload, '1');

      expect(updatePasswordUseCase.updatePassword).toHaveBeenCalledWith(payload, '1', '1');
      expect(result).toEqual({
        statusCode: 200,
        status: true,
        code: 'SUCCESS',
        message: 'Password updated successfully',
        data: null,
      });
    });
  });

  describe('findById', () => {
    it('should get user by id and return wrapped response', async () => {
      const user = {
        id: '1',
        name: 'John Doe',
        username: 'john123',
        email: 'john@test.com',
        role: ROLE.USER,
      };
      mockFindByIdUsersUseCase.findById.mockResolvedValue(user);

      const result = await controller.findById('1');

      expect(findByIdUsersUseCase.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        statusCode: 200,
        status: true,
        code: 'SUCCESS',
        message: 'User retrieved successfully',
        data: user,
      });
    });
  });

  describe('findByEmail', () => {
    it('should return user by email with wrapped response', async () => {
      const request = {
        user: {
          id: '1',
          email: 'john@test.com',
          role: ROLE.USER,
        },
      };
      const user = {
        id: '1',
        name: 'John Doe',
        username: 'john123',
        email: 'john@test.com',
        role: ROLE.USER,
      };

      mockFindByEmailUsersUseCase.findByEmail.mockResolvedValue(user);

      const result = await controller.findByEmail(request, 'john@test.com');

      expect(findByEmailUsersUseCase.findByEmail).toHaveBeenCalledWith('john@test.com', request.user);
      expect(result).toEqual({
        statusCode: 200,
        status: true,
        code: 'SUCCESS',
        message: 'User retrieved successfully',
        data: user,
      });
    });
  });

  describe('findByUsername', () => {
    it('should return user by username with wrapped response', async () => {
      const user = {
        id: '1',
        name: 'John Doe',
        username: 'john123',
        email: 'john@test.com',
        role: ROLE.USER,
      };

      mockFindByUsernameUsersUseCase.findByUsername.mockResolvedValue(user);

      const result = await controller.findByUsername('john123');

      expect(findByUsernameUsersUseCase.findByUsername).toHaveBeenCalledWith('john123');
      expect(result).toEqual({
        statusCode: 200,
        status: true,
        code: 'SUCCESS',
        message: 'User retrieved successfully',
        data: user,
      });
    });
  });
});
