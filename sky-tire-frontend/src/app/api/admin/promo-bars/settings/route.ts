import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getOrCreatePromoBarSettings,
  validateSettingsInput,
} from '@/lib/promoBarValidation';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateSettingsInput(body.autoplayDelay);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await getOrCreatePromoBarSettings(prisma);
    const settings = await prisma.promoBarSettings.update({
      where: { id: 'global' },
      data: { autoplayDelay: Number(body.autoplayDelay) },
    });

    return NextResponse.json({ autoplayDelay: settings.autoplayDelay });
  } catch (error) {
    console.error('Error updating promo bar settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
