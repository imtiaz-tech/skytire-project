import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getOrCreateRotatorSettings,
  serializeRotatorHeadline,
  serializeRotatorSettings,
} from '@/lib/rotatorValidation';

export async function GET() {
  try {
    const [settings, headlines] = await Promise.all([
      getOrCreateRotatorSettings(prisma),
      prisma.rotatorHeadline.findMany({ orderBy: { order: 'asc' } }),
    ]);

    const serialized = serializeRotatorSettings(settings);
    return NextResponse.json({
      ...serialized,
      headlines: headlines.map(serializeRotatorHeadline),
    });
  } catch (error) {
    console.error('Error fetching rotator:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
