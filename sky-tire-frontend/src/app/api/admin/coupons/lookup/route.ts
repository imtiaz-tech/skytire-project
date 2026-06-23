import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'products';
  const search = searchParams.get('search') || '';

  try {
    if (type === 'brands') {
      const brands = await prisma.brand.findMany({
        where: search
          ? { brandName: { contains: search, mode: 'insensitive' } }
          : undefined,
        select: { id: true, brandName: true, category: true },
        orderBy: { brandName: 'asc' },
        take: 200,
      });
      return NextResponse.json(brands);
    }

    const [tires, wheels, wireWheels, boltOnWireWheels, accessories] = await Promise.all([
      prisma.tire.findMany({
        where: search
          ? {
              OR: [
                { sku: { contains: search, mode: 'insensitive' } },
                { model: { modelName: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : undefined,
        select: {
          id: true,
          sku: true,
          model: { select: { modelName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.wheel.findMany({
        where: search
          ? {
              OR: [
                { sku: { contains: search, mode: 'insensitive' } },
                { productName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        select: { id: true, sku: true, productName: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.wireWheel.findMany({
        where: search
          ? {
              OR: [
                { sku: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        select: { id: true, sku: true, name: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.boltOnWireWheel.findMany({
        where: search
          ? {
              OR: [
                { sku: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        select: { id: true, sku: true, name: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.accessory.findMany({
        where: search
          ? {
              OR: [
                { sku: { contains: search, mode: 'insensitive' } },
                { productName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        select: { id: true, sku: true, productName: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const products = [
      ...tires.map((t) => ({
        id: t.id,
        label: `[Tire] ${t.model?.modelName ?? 'Unknown'} (${t.sku ?? 'No SKU'})`,
        type: 'tire',
      })),
      ...wheels.map((w) => ({
        id: w.id,
        label: `[Wheel] ${w.productName} (${w.sku})`,
        type: 'wheel',
      })),
      ...wireWheels.map((w) => ({
        id: w.id,
        label: `[Wire Wheel] ${w.name} (${w.sku})`,
        type: 'wire_wheel',
      })),
      ...boltOnWireWheels.map((w) => ({
        id: w.id,
        label: `[Bolt-On Wire Wheel] ${w.name} (${w.sku})`,
        type: 'bolt_on_wire_wheel',
      })),
      ...accessories.map((a) => ({
        id: a.id,
        label: `[Accessory] ${a.productName} (${a.sku})`,
        type: 'accessory',
      })),
    ];

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching coupon lookup:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
