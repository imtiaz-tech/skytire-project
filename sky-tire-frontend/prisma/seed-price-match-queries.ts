import { PrismaClient, PriceMatchProductType } from '@prisma/client';

const prisma = new PrismaClient();

const sampleQueries = [
  {
    competitor: 'Priority tire',
    competitorURL: 'https://www.prioritytire.com/example-product',
    competitorPrice: '146.41',
    fullName: 'Logan malone',
    email: 'skittlesbih@gmail.com',
    phone: '2398231829',
    zipCode: '33909',
  },
  {
    competitor: 'CROWDFUSED',
    competitorURL: 'https://www.crowdfused.com/example-product',
    competitorPrice: '82.18',
    fullName: 'Test',
    email: 'test@example.com',
    phone: '5551234567',
    zipCode: '90210',
  },
  {
    competitor: 'Simpletire',
    competitorURL: 'https://www.simpletire.com/example-product',
    competitorPrice: '50.00',
    fullName: 'Hanan',
    email: 'hanan@example.com',
    phone: '5559876543',
    zipCode: '10001',
  },
  {
    competitor: 'Summit',
    competitorURL: 'https://www.summitracing.com/example-product',
    competitorPrice: '1.00',
    fullName: 'Andrew Padilla',
    email: 'andrew@example.com',
    phone: '5554443322',
    zipCode: '33101',
  },
];

async function getProductRefs(): Promise<
  { productId: string; productType: PriceMatchProductType }[]
> {
  const tires = await prisma.tire.findMany({
    take: 4,
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  if (tires.length >= 4) {
    return tires.map((t) => ({ productId: t.id, productType: 'TIRE' as const }));
  }

  const refs: { productId: string; productType: PriceMatchProductType }[] = tires.map((t) => ({
    productId: t.id,
    productType: 'TIRE',
  }));

  const wheels = await prisma.wheel.findMany({
    take: 4 - refs.length,
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  wheels.forEach((w) => refs.push({ productId: w.id, productType: 'WHEEL' }));

  return refs;
}

async function main() {
  const existing = await prisma.priceMatchQuery.count();
  if (existing >= 4) {
    console.log(`Skipping seed: ${existing} price match queries already exist.`);
    return;
  }

  const productRefs = await getProductRefs();
  if (productRefs.length === 0) {
    console.error('No products found. Add tires or wheels before seeding price match queries.');
    process.exit(1);
  }

  console.log('Seeding price match queries...');

  for (let i = 0; i < sampleQueries.length; i++) {
    const sample = sampleQueries[i];
    const product = productRefs[i % productRefs.length];

    await prisma.priceMatchQuery.create({
      data: {
        ...sample,
        productId: product.productId,
        productType: product.productType,
      },
    });

    console.log(`Created price match query for ${sample.fullName}`);
  }

  console.log('Price match query seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
