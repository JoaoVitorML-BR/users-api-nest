import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { ROLE } from "src/modules/users/user.entity";
import { UserService } from "src/modules/users/user.service";

@Injectable()
export class AuthorizationGuard implements CanActivate {
    constructor(private userService: UserService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const loggedUser = request.user;
        const targetUserId = request.params.id;

        const targetUser = await this.userService.findById(targetUserId);
        if (!targetUser) {
            throw new ForbiddenException('Target user not found.');
        }

        // Admin Master can access and update any user
        if (loggedUser.role === ROLE.ADMIN_MASTER) {
            return true;
        }

        // Admin can access their own data and any user data except Admin Master and other Admins
        if (loggedUser.role === ROLE.ADMIN) {
            if (targetUser.role === ROLE.ADMIN_MASTER) {
                throw new ForbiddenException('Admin cannot access Admin Master data.');
            }

            if (targetUser.role === ROLE.ADMIN && loggedUser.id !== targetUserId) {
                throw new ForbiddenException('Admin cannot access other Admin data.');
            }

            if (loggedUser.id === targetUserId || targetUser.role === ROLE.USER) {
                return true;
            }
        }

        // User can only access their own data
        if (loggedUser.id === targetUserId) {
            return true;
        }
        throw new ForbiddenException('Access denied.');
    }
}