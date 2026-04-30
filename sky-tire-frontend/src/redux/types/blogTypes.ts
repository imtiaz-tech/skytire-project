export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  _count?: { blogs: number };
  createdAt: string;
  updatedAt: string;
}

export enum BlogStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export interface Blog {
  id: string;
  blogTitle: string;
  slug: string;
  oldSlugs: string[];
  featuredImage: string;
  blogBody: string;
  keywords: string[];
  blogStatus: BlogStatus;
  publishedAt: string | null;
  readingTime: number;
  isFeatured: boolean;
  ctaHeading?: string;
  ctaDescription?: string;
  ctaButtonUrl?: string;
  ctaButtonText?: string;
  colors?: any;
  sections?: any;
  categoryId: string;
  category?: BlogCategory;
  authorId: number;
  author?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}
