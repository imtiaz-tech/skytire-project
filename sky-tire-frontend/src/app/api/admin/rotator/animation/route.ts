import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildAnimationData,
  getOrCreateRotatorSettings,
  validateAnimationInput,
} from '@/lib/rotatorValidation';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateAnimationInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await getOrCreateRotatorSettings(prisma);
    const settings = await prisma.rotatorSettings.update({
      where: { id: 'global' },
      data: buildAnimationData(body),
    });

    return NextResponse.json({
      animationDuration: settings.animationDuration,
      animationCurve: settings.animationCurve,
      stayDuration: settings.stayDuration,
    });
  } catch (error) {
    console.error('Error updating rotator animation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
