import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';

@Injectable()
export class BlogCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createBlogCategoryDto: CreateBlogCategoryDto) {
    const existing = await this.prisma.blogCategory.findFirst({
      where: {
        OR: [
          { name: createBlogCategoryDto.name },
          { slug: createBlogCategoryDto.slug },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Category with this name or slug already exists');
    }

    return this.prisma.blogCategory.create({
      data: createBlogCategoryDto,
    });
  }

  findAll() {
    return this.prisma.blogCategory.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { blogs: true }
        }
      }
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.blogCategory.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, updateBlogCategoryDto: UpdateBlogCategoryDto) {
    await this.findOne(id); // ensure exists
    
    if (updateBlogCategoryDto.name || updateBlogCategoryDto.slug) {
       const existing = await this.prisma.blogCategory.findFirst({
        where: {
          OR: [
            ...(updateBlogCategoryDto.name ? [{ name: updateBlogCategoryDto.name }] : []),
            ...(updateBlogCategoryDto.slug ? [{ slug: updateBlogCategoryDto.slug }] : []),
          ],
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Category with this name or slug already exists');
      }
    }

    return this.prisma.blogCategory.update({
      where: { id },
      data: updateBlogCategoryDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.blogCategory.delete({
      where: { id },
    });
  }
}
