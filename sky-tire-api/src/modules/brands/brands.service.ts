import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBrandDto, brandLogo: string) {
    return this.prisma.brand.create({
      data: {
        ...dto,
        brandLogo,
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          brandName: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {};

    const [brands, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      brands,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
    };
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async update(id: string, dto: UpdateBrandDto, newLogo?: string) {
    const brand = await this.findOne(id);

    if (newLogo && brand.brandLogo) {
      // Remove old logo
      const oldPath = path.join(process.cwd(), brand.brandLogo);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    return this.prisma.brand.update({
      where: { id },
      data: {
        ...dto,
        brandLogo: newLogo || brand.brandLogo,
      },
    });
  }

  async remove(id: string) {
    const brand = await this.findOne(id);
    if (brand.brandLogo) {
      const filePath = path.join(process.cwd(), brand.brandLogo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    return this.prisma.brand.delete({
      where: { id },
    });
  }
}
