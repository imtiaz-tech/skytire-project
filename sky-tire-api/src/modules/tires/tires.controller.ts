import { Controller, Get, Param } from '@nestjs/common';
import { TiresService } from './tires.service';

@Controller('admin/products')
export class TiresController {
  constructor(private readonly tiresService: TiresService) {}

  @Get('by-brand/:brandId')
  async findByBrand(@Param('brandId') brandId: string) {
    return this.tiresService.findByBrand(brandId);
  }
}
