import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<any>();
    const userId = request.session?.userId;

    if (!userId) {
      throw new UnauthorizedException('Please login to access this resource');
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User no longer exists or is inactive');
      }

      // Assign the user to the request object
      request['user'] = user;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }

    return true;
  }
}

