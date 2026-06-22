import { prisma } from '@/lib/prisma';

export const DEFAULT_ACCESSORY_CATEGORIES = [
  'Lowrider Adapters',
  'Lowrider Knock Offs',
  'Lowrider Tools',
];

export async function ensureDefaultAccessoryCategories() {
  const count = await prisma.accessoryCategory.count();
  if (count > 0) return;

  await prisma.accessoryCategory.createMany({
    data: DEFAULT_ACCESSORY_CATEGORIES.map((name) => ({ name })),
    skipDuplicates: true,
  });
}
