import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TiresService {
  constructor(private prisma: PrismaService) {}

  async findByBrand(brandId: string) {
    return this.prisma.tire.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
