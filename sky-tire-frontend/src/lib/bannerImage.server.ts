import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const UPLOAD_DIR = join(process.cwd(), '../sky-tire-api/uploads/banners');

export async function saveBannerImage(file: File): Promise<string> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `banner-${Date.now()}.webp`;
  const path = join(UPLOAD_DIR, filename);

  try {
    const sharp = (await import('sharp')).default;
    const webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
    await writeFile(path, webpBuffer);
  } catch {
    await writeFile(path, buffer);
  }

  return filename;
}
