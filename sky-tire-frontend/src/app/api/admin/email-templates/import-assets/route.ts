import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';

/** Store under the Next app so we can serve assets same-origin (Unlayer iframe). */
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'email-imports');

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

function publicUploadUrl(filename: string): string {
  // Same-origin URL — works in the Unlayer editor without the Nest API running.
  return `/api/admin/email-templates/import-assets?file=${encodeURIComponent(filename)}`;
}

/**
 * Upload one or more email-import image assets and return public URLs.
 * POST multipart/form-data with fields named "files" (multiple allowed).
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const uploaded: { originalName: string; filename: string; url: string }[] = [];

    for (const file of files) {
      const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBase}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(join(UPLOAD_DIR, filename), buffer);
      uploaded.push({
        originalName: file.name,
        filename,
        url: publicUploadUrl(filename),
      });
    }

    return NextResponse.json({ uploaded });
  } catch (error) {
    console.error('Email import asset upload failed:', error);
    return NextResponse.json({ error: 'Failed to upload assets' }, { status: 500 });
  }
}

/**
 * Serve a previously uploaded import asset (same-origin for Unlayer).
 * GET /api/admin/email-templates/import-assets?file=...
 */
export async function GET(request: NextRequest) {
  try {
    const fileParam = request.nextUrl.searchParams.get('file');
    if (!fileParam) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    // Prevent path traversal
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
    console.error('Email import asset serve failed:', error);
    return NextResponse.json({ error: 'Failed to serve asset' }, { status: 500 });
  }
}
