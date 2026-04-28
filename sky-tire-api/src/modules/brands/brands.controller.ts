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
  async create(@Req() req: fastify.FastifyRequest) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data');
    }
    const parts = req.parts();
    const fields: any = {};
    let brandLogo: string | undefined;
    let coverPhoto: string | undefined;

    const fs = require('fs');
    const util = require('util');
    const pipeline = util.promisify(require('stream').pipeline);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for await (const part of parts) {
      if (part.type === 'file') {
        if (!allowedTypes.includes(part.mimetype)) {
          throw new BadRequestException(`Invalid file type for ${part.fieldname}. Allowed: jpeg, jpg, png, webp`);
        }

        const filename = `${Date.now()}-${part.filename}`;
        const savePath = `uploads/${filename}`;
        await pipeline(part.file, fs.createWriteStream(savePath));

        if (part.fieldname === 'brandLogo' || part.fieldname === 'file') {
          brandLogo = filename;
        } else if (part.fieldname === 'coverPhoto') {
          coverPhoto = filename;
        }
      } else {
        fields[part.fieldname] = (part as any).value;
      }
    }

    if (!fields.brandName) throw new BadRequestException('brandName should not be empty');
    if (!fields.category) throw new BadRequestException('category should not be empty');
    if (!brandLogo) throw new BadRequestException('Brand logo is required');

    const dto: CreateBrandDto = {
      brandName: fields.brandName,
      category: fields.category,
      description: fields.description,
      isFeatured: fields.isFeatured === 'true',
    };

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
  ) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data');
    }
    const parts = req.parts();
    const fields: any = {};
    let brandLogo: string | undefined;
    let coverPhoto: string | undefined;

    const fs = require('fs');
    const util = require('util');
    const pipeline = util.promisify(require('stream').pipeline);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for await (const part of parts) {
      if (part.type === 'file') {
        if (!allowedTypes.includes(part.mimetype)) {
          throw new BadRequestException(`Invalid file type for ${part.fieldname}. Allowed: jpeg, jpg, png, webp`);
        }

        const filename = `${Date.now()}-${part.filename}`;
        const savePath = `uploads/${filename}`;
        await pipeline(part.file, fs.createWriteStream(savePath));

        if (part.fieldname === 'brandLogo' || part.fieldname === 'file') {
          brandLogo = filename;
        } else if (part.fieldname === 'coverPhoto') {
          coverPhoto = filename;
        }
      } else {
        fields[part.fieldname] = (part as any).value;
      }
    }

    const dto: UpdateBrandDto = {
      brandName: fields.brandName,
      category: fields.category,
      description: fields.description,
      isFeatured: fields.isFeatured === 'true' ? true : fields.isFeatured === 'false' ? false : undefined,
    };

    return this.brandsService.update(id, dto, brandLogo, coverPhoto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
