import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsInt, Matches } from 'class-validator';
import { BlogStatus } from '@prisma/client';

export class CreateBlogDto {
  @IsNotEmpty()
  @IsString()
  blogTitle: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be valid lowercase alphanumeric characters and hyphens',
  })
  slug: string;

  @IsNotEmpty()
  @IsString()
  blogBody: string;

  @IsOptional()
  @IsArray()
  keywords?: string[];

  @IsOptional()
  @IsEnum(BlogStatus)
  blogStatus?: BlogStatus;

  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  ctaHeading?: string;

  @IsOptional()
  @IsString()
  ctaDescription?: string;

  @IsOptional()
  @IsString()
  ctaButtonUrl?: string;

  @IsOptional()
  @IsString()
  ctaButtonText?: string;

  @IsOptional()
  colors?: any;

  @IsOptional()
  sections?: any;

  @IsOptional()
  @IsInt()
  readingTime?: number;

  @IsOptional()
  @IsString()
  authorName?: string;
}
