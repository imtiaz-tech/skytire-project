import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildColorsData,
  getOrCreateRotatorSettings,
  validateColorsInput,
} from '@/lib/rotatorValidation';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateColorsInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await getOrCreateRotatorSettings(prisma);
    const settings = await prisma.rotatorSettings.update({
      where: { id: 'global' },
      data: buildColorsData(body),
    });

    return NextResponse.json({
      bgGradientStart: settings.bgGradientStart,
      bgGradientMiddle: settings.bgGradientMiddle,
      bgGradientEnd: settings.bgGradientEnd,
      borderColor: settings.borderColor,
      textColor: settings.textColor,
      glowColor: settings.glowColor,
    });
  } catch (error) {
    console.error('Error updating rotator colors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
