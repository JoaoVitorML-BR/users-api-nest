import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "../user.service";
import { UpdatePasswordUseCase } from "./update-user-password.use-case";
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UpdatePasswordUseCase', () => {
    let updatePasswordUseCase: UpdatePasswordUseCase;
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdatePasswordUseCase,
                {
                    provide: UserService,
                    useValue: {
                        findById: jest.fn(),
                        updatePassword: jest.fn()
                    }
                }
            ]
        }).compile();

        updatePasswordUseCase = module.get<UpdatePasswordUseCase>(UpdatePasswordUseCase);
        userService = module.get<UserService>(UserService);
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(updatePasswordUseCase).toBeDefined();
    });

    describe('updatePassword', () => {
        it('should update password successfully', async () => {
            const mockUser = {
                id: '1',
                name: 'John Doe',
                username: 'john123',
                email: 'john.doe@example.com',
                password: '$2b$10$hashedpassword123',
                role: 'USER',
            };
            const updateData = {
                currentPassword: 'currentpassword',
                newPassword: 'NewPassword123!',
                confirmNewPassword: 'NewPassword123!'
            };
            (userService.findById as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhashedpassword123');
            (userService.updatePassword as jest.Mock).mockResolvedValue(true);

            const result = await updatePasswordUseCase.updatePassword(updateData, '1', '1');

            expect(userService.findById).toHaveBeenCalledWith('1');
            expect(bcrypt.compare).toHaveBeenCalledWith('currentpassword', mockUser.password);
            expect(userService.updatePassword).toHaveBeenCalled();
            expect(result).toEqual({
                statusCode: 200,
                status: true,
                code: 'SUCCESS',
                message: 'Password updated successfully',
                data: null
            });
        });

        it('should throw BadRequestException for incorrect current password', async () => {
            const mockUser = {
                id: '1',
                name: 'John Doe',
                username: 'john123',
                email: 'john.doe@example.com',
                password: '$2b$10$hashedpassword123',
                role: 'USER',
            };
            const updateData = {
                currentPassword: 'wrongpassword',
                newPassword: 'NewPassword123!',
                confirmNewPassword: 'NewPassword123!'
            };
            (userService.findById as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(updatePasswordUseCase.updatePassword(updateData, '1', '1')).rejects.toThrow('Current password is incorrect');
        });

        it('should throw BadRequestException for non-matching new passwords', async () => {
            const mockUser = {
                id: '1',
                name: 'John Doe',
                username: 'john123',
                email: 'john.doe@example.com',
                password: '$2b$10$hashedpassword123',
                role: 'USER',
            };
            const updateData = {
                currentPassword: 'currentpassword',
                newPassword: 'NewPassword123!',
                confirmNewPassword: 'DifferentNewPassword123!'
            };
            (userService.findById as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(updatePasswordUseCase.updatePassword(updateData, '1', '1')).rejects.toThrow('New passwords do not match');
        });
    });
});