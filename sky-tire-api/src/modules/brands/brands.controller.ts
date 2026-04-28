import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException,
  Req
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import * as fastify from 'fastify';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  async create(@Req() req: fastify.FastifyRequest, @Body() dto: CreateBrandDto) {
    const parts = req.files();
    let brandLogo: string | undefined;
    let coverPhoto: string | undefined;

    const fs = require('fs');
    const util = require('util');
    const pipeline = util.promisify(require('stream').pipeline);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for await (const data of parts) {
      if (!allowedTypes.includes(data.mimetype)) {
        throw new BadRequestException(`Invalid file type for ${data.fieldname}. Allowed: jpeg, jpg, png, webp`);
      }

      const filename = `${Date.now()}-${data.filename}`;
      const uploadPath = `uploads/${filename}`;
      await pipeline(data.file, fs.createWriteStream(uploadPath));

      if (data.fieldname === 'brandLogo' || data.fieldname === 'file') {
        brandLogo = uploadPath;
      } else if (data.fieldname === 'coverPhoto') {
        coverPhoto = uploadPath;
      }
    }

    if (!brandLogo) {
      throw new BadRequestException('Brand logo is required');
    }

    return this.brandsService.create(dto, brandLogo, coverPhoto);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('category') category: string,
    @Query('search') search?: string,
  ) {
    if (!category) {
      throw new BadRequestException('Category is required');
    }
    return this.brandsService.findAll(Number(page), Number(limit), category, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: fastify.FastifyRequest,
    @Body() dto: UpdateBrandDto,
  ) {
    const parts = req.files();
    let brandLogo: string | undefined;
    let coverPhoto: string | undefined;

    const fs = require('fs');
    const util = require('util');
    const pipeline = util.promisify(require('stream').pipeline);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for await (const data of parts) {
      if (!allowedTypes.includes(data.mimetype)) {
        throw new BadRequestException(`Invalid file type for ${data.fieldname}. Allowed: jpeg, jpg, png, webp`);
      }

      const filename = `${Date.now()}-${data.filename}`;
      const uploadPath = `uploads/${filename}`;
      await pipeline(data.file, fs.createWriteStream(uploadPath));

      if (data.fieldname === 'brandLogo' || data.fieldname === 'file') {
        brandLogo = uploadPath;
      } else if (data.fieldname === 'coverPhoto') {
        coverPhoto = uploadPath;
      }
    }

    return this.brandsService.update(id, dto, brandLogo, coverPhoto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
