import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  MAIN_PAGE_FAQ_CATEGORIES,
  isMainPageFaqCategory,
} from '@/lib/faqEditor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (category) {
      if (!isMainPageFaqCategory(category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }

      const faq = await prisma.mainPageFaq.findUnique({ where: { category } });
      return NextResponse.json({
        category,
        content: faq?.content || '',
        updatedAt: faq?.updatedAt || null,
      });
    }

    const faqs = await prisma.mainPageFaq.findMany();
    const byCategory = Object.fromEntries(
      MAIN_PAGE_FAQ_CATEGORIES.map((c) => {
        const row = faqs.find((f) => f.category === c.key);
        return [
          c.key,
          {
            category: c.key,
            content: row?.content || '',
            updatedAt: row?.updatedAt || null,
          },
        ];
      })
    );

    return NextResponse.json({ faqs: byCategory });
  } catch (error) {
    console.error('Error fetching main page FAQs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const category = typeof body.category === 'string' ? body.category : '';
    const content = typeof body.content === 'string' ? body.content : '';

    if (!isMainPageFaqCategory(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const faq = await prisma.mainPageFaq.upsert({
      where: { category },
      create: { category, content: content || null },
      update: { content: content || null },
    });

    return NextResponse.json({
      category: faq.category,
      content: faq.content || '',
      updatedAt: faq.updatedAt,
    });
  } catch (error) {
    console.error('Error saving main page FAQs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
