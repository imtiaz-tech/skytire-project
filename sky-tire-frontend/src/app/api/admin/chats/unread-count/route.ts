import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const count = await prisma.chatConversation.count({
      where: { isRead: false },
    });
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching unread chat count:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
