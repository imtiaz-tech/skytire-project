import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get one conversation + messages. Marks as read for admin.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const wasUnread = !conversation.isRead;
    if (wasUnread) {
      await prisma.chatConversation.update({
        where: { id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        name: conversation.name,
        email: conversation.email,
        phone: conversation.phone,
        isRead: true,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        wasUnread,
      },
      messages: conversation.messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching chat conversation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Admin reply to a conversation.
 * Body: { message }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const message = String(body?.message || '').trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const conversation = await prisma.chatConversation.findUnique({ where: { id } });
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const created = await prisma.chatMessage.create({
      data: {
        conversationId: id,
        sender: 'ADMIN',
        body: message,
      },
    });

    await prisma.chatConversation.update({
      where: { id },
      data: { isRead: true, updatedAt: new Date() },
    });

    return NextResponse.json({
      ...created,
      createdAt: created.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error sending admin chat reply:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
