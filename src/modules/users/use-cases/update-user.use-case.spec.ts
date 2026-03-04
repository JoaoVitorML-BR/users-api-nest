import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "../user.service";
import { UpdateUserUseCase } from "./update-user.use-case";

describe('UpdateUserUseCase', () => {
    let updateUserUseCase: UpdateUserUseCase;
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateUserUseCase,
                {
                    provide: UserService,
                    useValue: {
                        findOne: jest.fn(),
                        update: jest.fn(),
                        findById: jest.fn()
                    }
                }
            ]
        }).compile();

        updateUserUseCase = module.get<UpdateUserUseCase>(UpdateUserUseCase);
        userService = module.get<UserService>(UserService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(updateUserUseCase).toBeDefined();
    });

    describe('updateUser', () => {
        it('should update user successfully', async () => {
            const mockUser = {
                id: '1',
                name: 'John Doe',
                username: 'john123',
                email: 'john@example.com',
                role: 'USER',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const mockUpdatedUser = {
                id: '1',
                name: 'John Updated',
                username: 'johnupdated',
                role: 'USER',
                isActive: true,
                updatedAt: new Date()
            };
            const updateData = {
                name: 'John Updated',
                username: 'johnupdated',
            };

            (userService.findById as jest.Mock).mockResolvedValue(mockUser);
            (userService.update as jest.Mock).mockResolvedValue(mockUpdatedUser);
            const result = await updateUserUseCase.update(updateData, '1');

            expect(result.statusCode).toBe(200);
            expect(result.status).toBe(true);
            expect(result.code).toBe('SUCCESS');
            expect(result.data).toEqual(mockUpdatedUser);
        });
    });
});