import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request['user'];

    if (!user) {
      throw new ForbiddenException('Authentication required. User not found in request context.');
    }

    if (!user.role) {
      throw new ForbiddenException('User permissions could not be verified (role missing).');
    }

    const hasRole = requiredRoles.some((role) => 
      user.role.toString().toUpperCase() === role.toUpperCase()
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Your role: ${user.role}. Required: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
