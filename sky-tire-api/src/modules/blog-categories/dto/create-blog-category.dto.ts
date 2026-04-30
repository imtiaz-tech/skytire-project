import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateBlogCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be valid lowercase alphanumeric characters and hyphens',
  })
  slug: string;
}
