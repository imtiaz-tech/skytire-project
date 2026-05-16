import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [tires, total] = await Promise.all([
      prisma.tire.findMany({
        where: {
          sources: {
            some: {
              id: id
            }
          }
        },
        skip,
        take: limit,
        include: {
          model: {
            include: {
              brand: true,
            },
          },
        },
        orderBy: {
          sku: 'asc',
        },
      }),
      prisma.tire.count({
        where: {
          sources: {
            some: {
              id: id
            }
          }
        }
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      tires,
      total,
      pages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching tires by inventory source:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
