import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { COUPON_CATEGORY_TABS } from '@/constants/couponCategories';

function parseIds(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

function categoryBrandFilter(category: string) {
  const tab = COUPON_CATEGORY_TABS.find((t) => t.key === category);
  return tab?.brandCategory ?? category;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const step = searchParams.get('step') || 'products';
  const category = searchParams.get('category') || 'tires';
  const search = searchParams.get('search') || '';
  const brandIds = parseIds(searchParams.get('brandIds'));
  const modelIds = parseIds(searchParams.get('modelIds'));

  try {
    if (step === 'brands') {
      const brandCategory = categoryBrandFilter(category);
      const brands = await prisma.brand.findMany({
        where: {
          category: brandCategory as 'tire' | 'wheel' | 'wire_wheel' | 'accessory' | 'bolt_on_wheels',
          ...(search ? { brandName: { contains: search, mode: 'insensitive' } } : {}),
        },
        select: { id: true, brandName: true, category: true },
        orderBy: { brandName: 'asc' },
        take: 200,
      });
      return NextResponse.json(
        brands.map((b) => ({
          id: b.id,
          label: b.brandName,
          category: b.category,
        }))
      );
    }

    if (step === 'tire-models') {
      if (brandIds.length === 0) return NextResponse.json([]);
      const models = await prisma.tireModel.findMany({
        where: {
          brandId: { in: brandIds },
          ...(search
            ? {
                OR: [
                  { modelName: { contains: search, mode: 'insensitive' } },
                  { brand: { brandName: { contains: search, mode: 'insensitive' } } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          modelName: true,
          brand: { select: { brandName: true } },
        },
        orderBy: { modelName: 'asc' },
        take: 300,
      });
      return NextResponse.json(
        models.map((m) => ({
          id: m.id,
          label: `${m.brand.brandName} — ${m.modelName}`,
        }))
      );
    }

    if (step === 'tire-sizes') {
      if (brandIds.length === 0 || modelIds.length === 0) return NextResponse.json([]);
      const tires = await prisma.tire.findMany({
        where: {
          modelId: { in: modelIds },
          model: { brandId: { in: brandIds } },
          ...(search
            ? {
                OR: [
                  { tireSize: { contains: search, mode: 'insensitive' } },
                  { sku: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          tireSize: true,
          sku: true,
          model: { select: { modelName: true, brand: { select: { brandName: true } } } },
        },
        orderBy: [{ tireSize: 'asc' }, { sku: 'asc' }],
        take: 500,
      });
      return NextResponse.json(
        tires.map((t) => ({
          id: t.id,
          label: `${t.model.brand.brandName} — ${t.model.modelName} — ${t.tireSize ?? 'No size'} (${t.sku ?? 'No SKU'})`,
          size: t.tireSize,
        }))
      );
    }

    if (step === 'wheel-products') {
      if (brandIds.length === 0) return NextResponse.json([]);
      const wheels = await prisma.wheel.findMany({
        where: {
          brandId: { in: brandIds },
          ...(search
            ? {
                OR: [
                  { wheelSize: { contains: search, mode: 'insensitive' } },
                  { productName: { contains: search, mode: 'insensitive' } },
                  { sku: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          wheelSize: true,
          productName: true,
          sku: true,
          brand: { select: { brandName: true } },
        },
        orderBy: [{ wheelSize: 'asc' }, { productName: 'asc' }],
        take: 500,
      });
      return NextResponse.json(
        wheels.map((w) => ({
          id: w.id,
          label: `${w.brand?.brandName ?? 'Unknown'} — Size ${w.wheelSize} — ${w.productName} (${w.sku})`,
          size: w.wheelSize,
        }))
      );
    }

    if (step === 'wire-wheel-products') {
      if (brandIds.length === 0) return NextResponse.json([]);
      const items = await prisma.wireWheel.findMany({
        where: {
          brandId: { in: brandIds },
          ...(search
            ? {
                OR: [
                  { size: { contains: search, mode: 'insensitive' } },
                  { name: { contains: search, mode: 'insensitive' } },
                  { sku: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          size: true,
          name: true,
          sku: true,
          brand: { select: { brandName: true } },
        },
        orderBy: [{ size: 'asc' }, { name: 'asc' }],
        take: 500,
      });
      return NextResponse.json(
        items.map((w) => ({
          id: w.id,
          label: `${w.brand?.brandName ?? 'Unknown'} — Size ${w.size} — ${w.name} (${w.sku})`,
          size: w.size,
        }))
      );
    }

    if (step === 'bolt-on-wire-wheel-products') {
      if (brandIds.length === 0) return NextResponse.json([]);
      const items = await prisma.boltOnWireWheel.findMany({
        where: {
          brandId: { in: brandIds },
          ...(search
            ? {
                OR: [
                  { size: { contains: search, mode: 'insensitive' } },
                  { name: { contains: search, mode: 'insensitive' } },
                  { sku: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          size: true,
          name: true,
          sku: true,
          brand: { select: { brandName: true } },
        },
        orderBy: [{ size: 'asc' }, { name: 'asc' }],
        take: 500,
      });
      return NextResponse.json(
        items.map((w) => ({
          id: w.id,
          label: `${w.brand?.brandName ?? 'Unknown'} — Size ${w.size} — ${w.name} (${w.sku})`,
          size: w.size,
        }))
      );
    }

    if (step === 'accessory-categories') {
      if (brandIds.length === 0) return NextResponse.json([]);
      const accessories = await prisma.accessory.findMany({
        where: {
          brandId: { in: brandIds },
          ...(search ? { category: { contains: search, mode: 'insensitive' } } : {}),
        },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
        take: 200,
      });
      return NextResponse.json(
        accessories.map((a) => ({
          id: a.category,
          label: a.category,
        }))
      );
    }

    // step === 'products' — list products for specific-products flow
    const searchFilter = search
      ? { contains: search, mode: 'insensitive' as const }
      : undefined;

    if (category === 'tires') {
      const tires = await prisma.tire.findMany({
        where: search
          ? {
              OR: [
                { sku: searchFilter },
                { tireSize: searchFilter },
                { model: { modelName: searchFilter } },
              ],
            }
          : undefined,
        select: {
          id: true,
          sku: true,
          tireSize: true,
          model: { select: { modelName: true, brand: { select: { brandName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      return NextResponse.json(
        tires.map((t) => ({
          id: t.id,
          label: `${t.model.brand.brandName} — ${t.model.modelName} — ${t.tireSize ?? 'No size'} (${t.sku ?? 'No SKU'})`,
        }))
      );
    }

    if (category === 'wheels') {
      const wheels = await prisma.wheel.findMany({
        where: search
          ? {
              OR: [
                { sku: searchFilter },
                { productName: searchFilter },
                { wheelSize: searchFilter },
              ],
            }
          : undefined,
        select: { id: true, sku: true, productName: true, wheelSize: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      return NextResponse.json(
        wheels.map((w) => ({
          id: w.id,
          label: `Size ${w.wheelSize} — ${w.productName} (${w.sku})`,
        }))
      );
    }

    if (category === 'wire_wheels') {
      const items = await prisma.wireWheel.findMany({
        where: search
          ? { OR: [{ sku: searchFilter }, { name: searchFilter }, { size: searchFilter }] }
          : undefined,
        select: { id: true, sku: true, name: true, size: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      return NextResponse.json(
        items.map((w) => ({
          id: w.id,
          label: `Size ${w.size} — ${w.name} (${w.sku})`,
        }))
      );
    }

    if (category === 'bolt_on_wire_wheels') {
      const items = await prisma.boltOnWireWheel.findMany({
        where: search
          ? { OR: [{ sku: searchFilter }, { name: searchFilter }, { size: searchFilter }] }
          : undefined,
        select: { id: true, sku: true, name: true, size: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      return NextResponse.json(
        items.map((w) => ({
          id: w.id,
          label: `Size ${w.size} — ${w.name} (${w.sku})`,
        }))
      );
    }

    if (category === 'accessories') {
      const items = await prisma.accessory.findMany({
        where: search
          ? { OR: [{ sku: searchFilter }, { productName: searchFilter }, { category: searchFilter }] }
          : undefined,
        select: { id: true, sku: true, productName: true, category: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      return NextResponse.json(
        items.map((a) => ({
          id: a.id,
          label: `${a.category} — ${a.productName} (${a.sku})`,
        }))
      );
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching coupon targets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
