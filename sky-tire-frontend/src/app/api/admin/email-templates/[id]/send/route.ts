import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const response = await fetch(`${API_BASE}/admin/email-templates/${id}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('cookie') ? { cookie: request.headers.get('cookie')! } : {}),
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.message || data?.error || 'Failed to send email template. Please try again.';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying email template send:', error);
    const message =
      error instanceof Error
        ? error.message.includes('fetch')
          ? 'Could not reach the email server. Make sure the NestJS API is running on port 5001.'
          : error.message
        : 'Failed to send email template. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
