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
import { FastifyRequest } from 'fastify';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  async create(@Req() req: FastifyRequest, @Body() dto: CreateBrandDto) {
    // In Fastify with @fastify/multipart, we handle file upload differently
    // However, to keep it simple and follow requirements, 
    // we assume the file is already processed or we use the 'file' from multipart
    const data = await req.file();
    if (!data) {
      throw new BadRequestException('Brand logo is required');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(data.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: jpeg, jpg, png, webp');
    }

    // Generate filename: Date.now() + originalname
    const filename = `${Date.now()}-${data.filename}`;
    const uploadPath = `uploads/${filename}`;

    // Save file
    const fs = require('fs');
    const util = require('util');
    const pipeline = util.promisify(require('stream').pipeline);
    await pipeline(data.file, fs.createWriteStream(uploadPath));

    return this.brandsService.create(dto, uploadPath);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.brandsService.findAll(Number(page), Number(limit), search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
    @Body() dto: UpdateBrandDto,
  ) {
    const data = await req.file();
    let uploadPath: string | undefined;

    if (data) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        throw new BadRequestException('Invalid file type. Allowed: jpeg, jpg, png, webp');
      }

      const filename = `${Date.now()}-${data.filename}`;
      uploadPath = `uploads/${filename}`;

      const fs = require('fs');
      const util = require('util');
      const pipeline = util.promisify(require('stream').pipeline);
      await pipeline(data.file, fs.createWriteStream(uploadPath));
    }

    return this.brandsService.update(id, dto, uploadPath);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
