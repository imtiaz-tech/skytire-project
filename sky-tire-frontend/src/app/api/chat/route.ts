import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Start a chat conversation (or resume by id) and optionally post the first message.
 * Body: { name, email, phone, message?, conversationId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const phone = String(body?.phone || '').trim();
    const message = String(body?.message || '').trim();
    const conversationId = String(body?.conversationId || '').trim() || null;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    let conversation = conversationId
      ? await prisma.chatConversation.findUnique({ where: { id: conversationId } })
      : null;

    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: {
          name,
          email,
          phone,
          isRead: false,
        },
      });
    } else {
      conversation = await prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { name, email, phone },
      });
    }

    let createdMessage = null;
    if (message) {
      createdMessage = await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          sender: 'VISITOR',
          body: message,
        },
      });
      await prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { isRead: false, updatedAt: new Date() },
      });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      conversation: {
        ...conversation,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
      messages: messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
      message: createdMessage
        ? { ...createdMessage, createdAt: createdMessage.createdAt.toISOString() }
        : null,
    });
  } catch (error) {
    console.error('Error starting chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
