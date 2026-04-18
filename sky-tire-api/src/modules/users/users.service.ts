import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });
  }
}
