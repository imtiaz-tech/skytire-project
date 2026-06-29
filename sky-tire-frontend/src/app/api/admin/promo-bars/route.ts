import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildPromoBarData,
  getOrCreatePromoBarSettings,
  serializePromoBar,
  validatePromoBarInput,
} from '@/lib/promoBarValidation';

export async function GET() {
  try {
    const [settings, promoBars] = await Promise.all([
      getOrCreatePromoBarSettings(prisma),
      prisma.promoBar.findMany({ orderBy: { order: 'asc' } }),
    ]);

    return NextResponse.json({
      settings: { autoplayDelay: settings.autoplayDelay },
      promoBars: promoBars.map(serializePromoBar),
    });
  } catch (error) {
    console.error('Error fetching promo bars:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validatePromoBarInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const maxOrder = await prisma.promoBar.aggregate({ _max: { order: true } });
    const order = (maxOrder._max.order ?? -1) + 1;

    const promoBar = await prisma.promoBar.create({
      data: {
        ...buildPromoBarData(body),
        order,
      },
    });

    return NextResponse.json(serializePromoBar(promoBar));
  } catch (error) {
    console.error('Error creating promo bar:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
