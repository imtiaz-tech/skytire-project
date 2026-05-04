import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const aiKey = searchParams.get('aiKey');

  if (!aiKey) {
    return NextResponse.json({ error: 'aiKey is required' }, { status: 400 });
  }

  try {
    const aiPrompt = await prisma.aIPrompt.findUnique({
      where: { aiKey },
    });

    if (!aiPrompt) {
      return NextResponse.json({ error: 'AI Prompt not found' }, { status: 404 });
    }

    return NextResponse.json(aiPrompt);
  } catch (error) {
    console.error('Error fetching AI Prompt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { aiKey, prompt } = body;

    if (!aiKey || !prompt) {
      return NextResponse.json({ error: 'aiKey and prompt are required' }, { status: 400 });
    }

    const updatedPrompt = await prisma.aIPrompt.update({
      where: { aiKey },
      data: { prompt },
    });

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error('Error updating AI Prompt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
