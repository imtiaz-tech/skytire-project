import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildHeadlineData,
  serializeRotatorHeadline,
  validateHeadlineInput,
} from '@/lib/rotatorValidation';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validationError = validateHeadlineInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const headline = await prisma.rotatorHeadline.update({
      where: { id },
      data: buildHeadlineData(body),
    });

    return NextResponse.json(serializeRotatorHeadline(headline));
  } catch (error) {
    console.error('Error updating rotator headline:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive is required' }, { status: 400 });
    }

    const headline = await prisma.rotatorHeadline.update({
      where: { id },
      data: { isActive: body.isActive },
    });

    return NextResponse.json(serializeRotatorHeadline(headline));
  } catch (error) {
    console.error('Error patching rotator headline:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.rotatorHeadline.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rotator headline:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
