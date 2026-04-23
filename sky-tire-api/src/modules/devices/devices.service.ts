import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Core security validation.
   * Called on every login/signup before session is granted.
   * Returns the device record (existing or newly created).
   */
  async validateAndRegisterDevice(userId: number, visitorId: string) {
    // 1. Check if the device already exists anywhere in the system
    const existingDevice = await this.prisma.device.findUnique({
      where: { visitorId },
    });

    if (existingDevice) {
      // Device exists — check if it's banned
      if (existingDevice.isBanned) {
        throw new ForbiddenException(
          'This device has been banned. Please contact support.',
        );
      }
      // Device exists and is clean — return it (no update needed)
      return existingDevice;
    }

    // 2. New device — check if the user is banned/inactive
    // If user is inactive, create device but immediately ban it
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });

    const isBanned = !user?.isActive;

    const device = await this.prisma.device.create({
      data: {
        visitorId,
        userId,
        isBanned,
        bannedAt: isBanned ? new Date() : null,
      },
    });

    if (isBanned) {
      throw new ForbiddenException(
        'Your account is inactive. Please contact support.',
      );
    }

    return device;
  }

  /** Get all devices for a user */
  async getUserDevices(userId: number) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Ban all devices of a user */
  async banUserDevices(userId: number) {
    await this.prisma.device.updateMany({
      where: { userId },
      data: { isBanned: true, bannedAt: new Date() },
    });
    return { message: 'All devices banned successfully' };
  }

  /** Unban all devices of a user */
  async unbanUserDevices(userId: number) {
    await this.prisma.device.updateMany({
      where: { userId },
      data: { isBanned: false, bannedAt: null },
    });
    return { message: 'All devices unbanned successfully' };
  }

  /** Ban/unban toggle for all user devices */
  async toggleUserDeviceBan(userId: number, ban: boolean) {
    if (ban) {
      return this.banUserDevices(userId);
    }
    return this.unbanUserDevices(userId);
  }
}
