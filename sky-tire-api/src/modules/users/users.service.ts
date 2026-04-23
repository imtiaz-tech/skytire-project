import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { DevicesService } from '../devices/devices.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private devicesService: DevicesService,
  ) {}

  async createUser(data: CreateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: data.email
      }
    });

    if (existingUser) {
      throw new ConflictException('User with that email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Auto-generate memberId if not provided (example rule)
    const memberId = data.memberId ?? Math.floor(Math.random() * 1000000);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        memberId,
        password: hashedPassword,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    let where: any = {};
    if (search) {
      const isSearchNumber = !isNaN(Number(search));
      where = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          ...(isSearchNumber ? [{ memberId: Number(search) }] : []),
        ],
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          memberId: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          devices: {
            select: {
              isBanned: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Compute hasAnyBannedDevice flag for Admin UI device-ban toggle
    const enriched = users.map(({ devices, ...u }) => ({
      ...u,
      allDevicesBanned: devices.length > 0 && devices.every((d) => d.isBanned),
      deviceCount: devices.length,
    }));

    return {
      users: enriched,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      limit: Number(limit),
    };
  }

  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      }
    });
  }

  /**
   * When admin toggles a user's isActive status:
   * - If deactivating (isActive = false) → also ban all devices
   * - If reactivating (isActive = true) → devices remain banned until admin explicitly unbans
   */
  async updateStatus(id: number, isActive: boolean) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      }
    });

    // Propagate: deactivating a user bans all their devices
    if (!isActive) {
      await this.devicesService.banUserDevices(id);
    }

    return updated;
  }

  /** Toggle ban state of all devices for a user (admin action) */
  async toggleDeviceBan(userId: number, ban: boolean) {
    return this.devicesService.toggleUserDeviceBan(userId, ban);
  }

  /** Get all devices for a user (admin device history) */
  async getUserDevices(userId: number) {
    return this.devicesService.getUserDevices(userId);
  }
}
