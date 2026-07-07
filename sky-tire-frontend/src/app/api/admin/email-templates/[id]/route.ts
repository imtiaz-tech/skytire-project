import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildEmailTemplateData,
  serializeEmailTemplate,
  validateEmailTemplateInput,
} from '@/lib/emailTemplateValidation';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const template = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 });
    }

    return NextResponse.json(serializeEmailTemplate(template));
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const validationError = validateEmailTemplateInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 });
    }

    const data = buildEmailTemplateData(body);
    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name: data.name,
        subject: data.subject,
        html: data.html,
        designJson: data.designJson,
      },
    });

    return NextResponse.json(serializeEmailTemplate(template));
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 });
    }

    await prisma.emailTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
