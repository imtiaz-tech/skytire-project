import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { aiKey } = body;

    if (!aiKey) {
      return NextResponse.json({ error: 'aiKey is required' }, { status: 400 });
    }

    const aiPrompt = await prisma.aIPrompt.findUnique({
      where: { aiKey },
    });

    if (!aiPrompt) {
      return NextResponse.json({ error: 'AI Prompt not found' }, { status: 404 });
    }

    const updatedPrompt = await prisma.aIPrompt.update({
      where: { aiKey },
      data: { prompt: aiPrompt.defaultPrompt },
    });

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error('Error resetting AI Prompt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
