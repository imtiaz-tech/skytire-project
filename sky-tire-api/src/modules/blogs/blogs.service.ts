import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogStatus } from '@prisma/client';

@Injectable()
export class BlogsService {
  constructor(private prisma: PrismaService) {}

  private calculateReadingTime(text: string): number {
    if (!text) return 1;
    const wordsPerMinute = 200;
    const textWithoutHtml = text.replace(/<[^>]*>?/gm, '');
    const words = textWithoutHtml.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  }

  async create(createBlogDto: CreateBlogDto, featuredImage: string, authorId: number) {
    const existing = await this.prisma.blog.findUnique({
      where: { slug: createBlogDto.slug },
    });
    if (existing) throw new ConflictException('Blog with this slug already exists');

    const readingTime = createBlogDto.readingTime || this.calculateReadingTime(createBlogDto.blogBody);
    const publishedAt = createBlogDto.blogStatus === BlogStatus.PUBLISHED ? new Date() : null;

    return this.prisma.blog.create({
      data: {
        ...createBlogDto,
        featuredImage,
        authorId,
        readingTime,
        publishedAt,
      },
    });
  }

  findAll(status?: string) {
    const where: any = {};
    if (status) {
      where.blogStatus = status.toUpperCase();
    }
    
    return this.prisma.blog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        author: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  async update(id: string, updateBlogDto: UpdateBlogDto, featuredImage?: string) {
    const blog = await this.findOne(id);
    
    let oldSlugs = blog.oldSlugs;
    if (updateBlogDto.slug && updateBlogDto.slug !== blog.slug) {
      const existing = await this.prisma.blog.findUnique({ where: { slug: updateBlogDto.slug } });
      if (existing && existing.id !== id) throw new ConflictException('Slug already in use');
      oldSlugs = [...new Set([...oldSlugs, blog.slug])];
    }

    const readingTime = updateBlogDto.readingTime 
      || (updateBlogDto.blogBody ? this.calculateReadingTime(updateBlogDto.blogBody) : blog.readingTime);

    let publishedAt = blog.publishedAt;
    if (updateBlogDto.blogStatus === BlogStatus.PUBLISHED && blog.blogStatus !== BlogStatus.PUBLISHED) {
      publishedAt = new Date();
    } else if (updateBlogDto.blogStatus === BlogStatus.DRAFT) {
      publishedAt = null;
    }

    const data: any = {
      ...updateBlogDto,
      oldSlugs,
      readingTime,
      publishedAt,
    };

    if (featuredImage) {
      data.featuredImage = featuredImage;
    }

    return this.prisma.blog.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.blog.delete({ where: { id } });
  }
}
