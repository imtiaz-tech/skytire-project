import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to define which roles can access a route.
 * Usage: @Roles('ADMIN') or @Roles('ADMIN', 'USER')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
