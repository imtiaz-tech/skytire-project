import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { BrandCategory } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  brandName: string;

  @IsEnum(BrandCategory)
  @IsNotEmpty()
  category: BrandCategory;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isFeatured?: boolean;
}
