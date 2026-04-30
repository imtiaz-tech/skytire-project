import { Controller, Get, Post, Patch, Param, Delete, UseGuards, Req, BadRequestException, Query } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { AuthGuard } from '../../auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import * as fastify from 'fastify';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Req() req: fastify.FastifyRequest) {
    if (!req.isMultipart()) throw new BadRequestException('Request must be multipart/form-data');
    const parts = req.parts();
    const fields: any = {};
    let featuredImage: string | undefined;

    const fs = require('fs');
    const util = require('util');
    const pipeline = util.promisify(require('stream').pipeline);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for await (const part of parts) {
      if (part.type === 'file') {
        if (!allowedTypes.includes(part.mimetype)) {
          throw new BadRequestException(`Invalid file type`);
        }
        const filename = `${Date.now()}-${part.filename}`;
        const savePath = `uploads/${filename}`;
        await pipeline(part.file, fs.createWriteStream(savePath));
        if (part.fieldname === 'featuredImage') featuredImage = filename;
      } else {
        fields[part.fieldname] = (part as any).value;
      }
    }

    if (!featuredImage) throw new BadRequestException('featuredImage is required');

    const dto = this.parseFields(fields);
    const authorId = (req as any).user?.id || 1;
    return this.blogsService.create(dto as any, featuredImage, authorId);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.blogsService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Req() req: fastify.FastifyRequest) {
    if (!req.isMultipart()) throw new BadRequestException('Request must be multipart/form-data');
    const parts = req.parts();
    const fields: any = {};
    let featuredImage: string | undefined;

    const fs = require('fs');
    const util = require('util');
    const pipeline = util.promisify(require('stream').pipeline);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for await (const part of parts) {
      if (part.type === 'file') {
        if (!allowedTypes.includes(part.mimetype)) throw new BadRequestException(`Invalid file type`);
        const filename = `${Date.now()}-${part.filename}`;
        const savePath = `uploads/${filename}`;
        await pipeline(part.file, fs.createWriteStream(savePath));
        if (part.fieldname === 'featuredImage') featuredImage = filename;
      } else {
        fields[part.fieldname] = (part as any).value;
      }
    }

    const dto = this.parseFields(fields);
    return this.blogsService.update(id, dto as any, featuredImage);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.blogsService.remove(id);
  }

  private parseFields(fields: any) {
    const dto: any = { ...fields };
    if (fields.isFeatured !== undefined) dto.isFeatured = fields.isFeatured === 'true';
    if (fields.keywords) {
      try { dto.keywords = JSON.parse(fields.keywords); } catch { dto.keywords = fields.keywords.split(','); }
    }
    if (fields.colors) {
      try { dto.colors = JSON.parse(fields.colors); } catch { delete dto.colors; }
    }
    if (fields.sections) {
      try { dto.sections = JSON.parse(fields.sections); } catch { delete dto.sections; }
    }
    if (fields.readingTime) {
      dto.readingTime = parseInt(fields.readingTime, 10);
    }
    return dto;
  }
}
