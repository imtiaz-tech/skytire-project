import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const summary = await prisma.inventoryUpdateSummary.findFirst({
      orderBy: { timestamp: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!summary) {
      return NextResponse.json({
        summary: null,
        message: 'No inventory update summary found',
      });
    }

    return NextResponse.json({
      summary,
      message: 'Summary retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching inventory update summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
