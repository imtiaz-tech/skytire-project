import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildHeadlineData,
  serializeRotatorHeadline,
  validateHeadlineInput,
} from '@/lib/rotatorValidation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateHeadlineInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const maxOrder = await prisma.rotatorHeadline.aggregate({ _max: { order: true } });
    const order = (maxOrder._max.order ?? -1) + 1;

    const headline = await prisma.rotatorHeadline.create({
      data: {
        ...buildHeadlineData(body),
        order,
      },
    });

    return NextResponse.json(serializeRotatorHeadline(headline));
  } catch (error) {
    console.error('Error creating rotator headline:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
