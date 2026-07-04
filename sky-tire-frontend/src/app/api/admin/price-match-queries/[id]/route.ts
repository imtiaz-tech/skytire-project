import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePriceMatchProduct } from '@/lib/priceMatchProduct.server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const query = await prisma.priceMatchQuery.findUnique({ where: { id } });
    if (!query) {
      return NextResponse.json({ error: 'Price match query not found' }, { status: 404 });
    }

    const product = await resolvePriceMatchProduct(prisma, query.productId, query.productType);

    return NextResponse.json({
      ...query,
      createdAt: query.createdAt.toISOString(),
      updatedAt: query.updatedAt.toISOString(),
      product: product
        ? {
            productId: product.productId,
            productType: product.productType,
            productName: product.productName,
            brandName: product.brandName,
            modelName: product.modelName,
            tireSize: product.tireSize,
            salePrice: product.salePrice,
            images: product.images,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching price match query:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const existing = await prisma.priceMatchQuery.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Price match query not found' }, { status: 404 });
    }

    if (existing.isRead) {
      return NextResponse.json({ id, isRead: true, wasUnread: false });
    }

    await prisma.priceMatchQuery.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ id, isRead: true, wasUnread: true });
  } catch (error) {
    console.error('Error marking price match query as read:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
