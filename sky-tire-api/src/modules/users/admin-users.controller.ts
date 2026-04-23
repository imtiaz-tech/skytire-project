import { Controller, Get, Patch, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthGuard } from '../../auth.guard';

@Controller('admin/users')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /admin/users — paginated list with search */
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(Number(page), Number(limit), search);
  }

  /** PATCH /admin/users/:id/status — toggle user active / inactive */
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.updateStatus(id, isActive);
  }

  /**
   * PATCH /admin/users/:id/devices/ban
   * Body: { ban: true | false }
   * Bans or unbans ALL devices for a user without touching user.isActive
   */
  @Patch(':id/devices/ban')
  async toggleDeviceBan(
    @Param('id', ParseIntPipe) id: number,
    @Body('ban') ban: boolean,
  ) {
    return this.usersService.toggleDeviceBan(id, ban);
  }

  /**
   * GET /admin/users/:id/devices
   * Returns the full device history list for a user
   */
  @Get(':id/devices')
  async getUserDevices(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserDevices(id);
  }
}
