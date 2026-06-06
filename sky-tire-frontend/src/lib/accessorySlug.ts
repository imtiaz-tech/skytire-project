import slugify from 'slugify';
import { prisma } from '@/lib/prisma';

const STOP_WORDS = new Set(['for', 'with', 'and', 'the', 'a', 'an', 'to', 'in']);

export function generateAccessorySlug(productName: string): string {
  const cleanTitle = productName
    .replace(/[–/]+/g, ' ')
    .replace(/[,]+/g, ' ')
    .split(' ')
    .filter((word) => word && !STOP_WORDS.has(word.toLowerCase()))
    .join(' ');

  return slugify(cleanTitle, {
    lower: true,
    remove: /[*+~()'"!:@,]/g,
    strict: true,
    trim: true,
  });
}

export async function getUniqueAccessorySlug(baseSlug: string, currentId?: string): Promise<string> {
  let slug = baseSlug || 'draft-accessory';
  let counter = 1;

  while (true) {
    const existing = await prisma.accessory.findFirst({
      where: {
        slug,
        ...(currentId ? { NOT: { id: currentId } } : {}),
      },
    });
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
