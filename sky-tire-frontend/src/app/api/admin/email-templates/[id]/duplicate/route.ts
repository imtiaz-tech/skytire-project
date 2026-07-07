import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeEmailTemplate } from '@/lib/emailTemplateValidation';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name: `${existing.name} (Copy)`,
        subject: existing.subject,
        html: existing.html,
        designJson: existing.designJson as object,
        createdById: existing.createdById,
      },
    });

    return NextResponse.json(serializeEmailTemplate(template));
  } catch (error) {
    console.error('Error duplicating email template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
