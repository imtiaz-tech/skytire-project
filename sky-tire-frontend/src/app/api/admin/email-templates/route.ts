import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildEmailTemplateData,
  serializeEmailTemplate,
  validateEmailTemplateInput,
} from '@/lib/emailTemplateValidation';

export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      templates: templates.map(serializeEmailTemplate),
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateEmailTemplateInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const data = buildEmailTemplateData(body);
    const template = await prisma.emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        html: data.html,
        designJson: data.designJson,
        createdById: data.createdById ?? undefined,
      },
    });

    return NextResponse.json(serializeEmailTemplate(template));
  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
