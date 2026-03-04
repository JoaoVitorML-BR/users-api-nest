import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { FindAllUsersUseCase } from './use-cases/find-all-users.use-case';
import { CreateUsersUseCase } from './use-cases/create-users.use-case';
import { CreateUsersAdminUseCase } from './use-cases/create-users-admin.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { UpdatePasswordUseCase } from './use-cases/update-user-password.use-case';
import { ROLE } from './user.entity';
import { AuthorizationGuard } from '../auth/guards/authorization.guard';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let findAllUsersUseCase: FindAllUsersUseCase;
  let createUsersUseCase: CreateUsersUseCase;
  let updateUserUseCase: UpdateUserUseCase;
  let updatePasswordUseCase: UpdatePasswordUseCase;

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
    updateUserUseCase = module.get<UpdateUserUseCase>(UpdateUserUseCase);
    updatePasswordUseCase = module.get<UpdatePasswordUseCase>(UpdatePasswordUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockResponse = {
        statusCode: 200,
        status: true,
        message: 'Users retrieved successfully',
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
      };

      mockFindAllUsersUseCase.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll();

      expect(findAllUsersUseCase.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should return empty array when no users exist', async () => {
      const mockResponse = {
        statusCode: 200,
        status: true,
        message: 'Users retrieved successfully',
        data: [],
      };

      mockFindAllUsersUseCase.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll();

      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(0);
    });

    it('should propagate errors from use case', async () => {
      const error = new Error('Database error');
      mockFindAllUsersUseCase.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow('Database error');
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
      const mockResponse = {
        statusCode: 201,
        status: true,
        message: 'User created successfully',
        data: {
          id: '1',
          ...validUserData,
          role: ROLE.USER,
        },
      };

      mockCreateUsersUseCase.create.mockResolvedValue(mockResponse);

      const result = await controller.create(validUserData);

      expect(createUsersUseCase.create).toHaveBeenCalledTimes(1);
      expect(createUsersUseCase.create).toHaveBeenCalledWith(validUserData);
      expect(result).toEqual(mockResponse);
    });

    it('should create first user with ADMIN_MASTER role', async () => {
      const mockResponse = {
        statusCode: 201,
        status: true,
        message: 'User created successfully',
        data: {
          id: '1',
          ...validUserData,
          role: ROLE.ADMIN_MASTER,
        },
      };

      mockCreateUsersUseCase.create.mockResolvedValue(mockResponse);

      const result = await controller.create(validUserData);

      expect(result.data).toBeDefined();
      expect((result.data as any).role).toBe(ROLE.ADMIN_MASTER);
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
});
