import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isMainPageFaqCategory } from '@/lib/faqEditor';

/** Public read endpoint for category landing pages. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;

    if (!isMainPageFaqCategory(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const faq = await prisma.mainPageFaq.findUnique({ where: { category } });
    return NextResponse.json({
      category,
      content: faq?.content || '',
      updatedAt: faq?.updatedAt || null,
    });
  } catch (error) {
    console.error('Error fetching public main page FAQ:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
