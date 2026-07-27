import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { getUploadImageUrl } from '@/lib/uploadImageUrl';

/**
 * Same disk location as tires / wheels / wire wheels / brands:
 *   sky-tire-api/uploads/{timestamp}-{filename}
 * Public URL (served by Nest @fastify/static):
 *   {API_HOST}/uploads/{filename}
 */
const UPLOAD_DIR = join(process.cwd(), '../sky-tire-api/uploads');

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
};

function guessMime(filename: string): string {
  const lower = filename.toLowerCase();
  const ext = lower.includes('.') ? lower.slice(lower.lastIndexOf('.')) : '';
  return MIME[ext] || 'application/octet-stream';
}

/**
 * Upload email images the same way product images are saved.
 * POST multipart/form-data field "files" (multiple allowed).
 * Also accepts "images" for consistency with wheels/tires forms.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = [
      ...formData.getAll('files'),
      ...formData.getAll('images'),
    ].filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const uploaded: { originalName: string; filename: string; url: string }[] = [];

    for (const file of files) {
      // Match wheels/tires naming: {timestamp}-{sanitized-original-name}
      const safeName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '-');
      const filename = `${Date.now()}-${safeName}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(join(UPLOAD_DIR, filename), buffer);

      uploaded.push({
        originalName: file.name,
        filename,
        // Same public URL helper used across admin (tires, wheels, brands, …)
        url: getUploadImageUrl(filename),
      });
    }

    return NextResponse.json({ uploaded });
  } catch (error) {
    console.error('Email image upload failed:', error);
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 });
  }
}

/**
 * Optional GET for local preview / debugging:
 * GET /api/admin/email-templates/import-assets?file={filename}
 */
export async function GET(request: NextRequest) {
  try {
    const fileParam = request.nextUrl.searchParams.get('file');
    if (!fileParam) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const filename = basename(fileParam);
    if (!filename || filename !== fileParam.replace(/^.*[/\\]/, '')) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    const fullPath = join(UPLOAD_DIR, filename);
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = await readFile(fullPath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': guessMime(filename),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Email image serve failed:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}
