import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminUsersController } from './admin-users.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [PrismaModule, DevicesModule],
  providers: [UsersService],
  controllers: [UsersController, AdminUsersController],
  exports: [UsersService],
})
export class UsersModule {}
