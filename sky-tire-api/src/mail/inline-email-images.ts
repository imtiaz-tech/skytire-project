import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const DATA_URL_RE =
  /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i;

const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
};

function extForMime(mime: string): string {
  return MIME_EXT[mime.toLowerCase()] || 'png';
}

function apiUploadsDir(): string {
  return join(process.cwd(), 'uploads');
}

function frontendEmailImportsDir(): string {
  return join(process.cwd(), '../sky-tire-frontend/uploads/email-imports');
}

/**
 * Public base URL Gmail can fetch images from.
 * Prefer EMAIL_IMAGE_BASE_URL (e.g. https://api.yourdomain.com or an ngrok URL).
 * Do NOT use CID attachments — Gmail shows those as "Attachments".
 */
export function getEmailImageBaseUrl(): string {
  const configured = (process.env.EMAIL_IMAGE_BASE_URL || process.env.API_PUBLIC_URL || '')
    .trim();
  const raw =
    configured || `http://localhost:${process.env.PORT || 5001}`;
  return raw.replace(/\/$/, '').replace(/\/api$/i, '');
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function isPrivateOrDataUrl(src: string): boolean {
  const s = decodeBasicEntities(src.trim());
  if (!s) return false;
  if (s.startsWith('cid:')) return true; // rewrite leftover cids if any
  if (s.startsWith('data:image')) return true;
  if (/assets\.unlayer\.com|cdn\.tools\.unlayer\.com|cdn\.templates\.unlayer\.com/i.test(s)) {
    return true;
  }
  if (/^(https?:)?\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])[:/]/i.test(s)) {
    return true;
  }
  if (/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(s)) {
    return true;
  }
  if (/^\/uploads\//i.test(s)) return true;
  if (/\/api\/admin\/email-templates\/import-assets/i.test(s)) return true;
  return false;
}

function publicUploadsUrl(filename: string): string {
  return `${getEmailImageBaseUrl()}/uploads/${filename}`;
}

async function ensureUploadsDir(): Promise<string> {
  const dir = apiUploadsDir();
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  return dir;
}

async function saveBufferAsUpload(
  buffer: Buffer,
  mime: string,
  hintName?: string
): Promise<string> {
  const dir = await ensureUploadsDir();
  const ext = extForMime(mime);
  const safe =
    (hintName || 'email-image')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/\.[a-zA-Z0-9]+$/, '') || 'email-image';
  const filename = `${Date.now()}-${safe}.${ext}`;
  await writeFile(join(dir, filename), buffer);
  return filename;
}

async function resolveUploadFilenameFromSrc(src: string): Promise<string | null> {
  const decoded = decodeBasicEntities(src.trim());

  // data:image/...;base64,... → save to uploads/
  const dataMatch = DATA_URL_RE.exec(decoded.replace(/\s+/g, ''));
  if (dataMatch) {
    const mime = dataMatch[1];
    const buffer = Buffer.from(dataMatch[2], 'base64');
    if (!buffer.length) return null;
    return saveBufferAsUpload(buffer, mime);
  }

  // Already an /uploads/... URL — extract filename (or copy from legacy folders)
  try {
    const u = new URL(decoded, 'http://localhost:5001');
    const fileParam = u.searchParams.get('file');
    if (fileParam) {
      const safe = basename(fileParam);
      for (const dir of [
        apiUploadsDir(),
        join(apiUploadsDir(), 'email-imports'),
        frontendEmailImportsDir(),
      ]) {
        const full = join(dir, safe);
        if (existsSync(full)) {
          // Prefer root uploads copy for a stable public path
          if (dir === apiUploadsDir()) return safe;
          const buffer = await readFile(full);
          return saveBufferAsUpload(buffer, guessMime(safe), safe);
        }
      }
    }

    const uploadsMatch = u.pathname.match(/\/uploads\/(.+)$/i);
    if (uploadsMatch) {
      const rel = decodeURIComponent(uploadsMatch[1])
        .split('/')
        .map((segment) => basename(segment))
        .join('/');
      const base = basename(rel);
      const candidates = [
        join(apiUploadsDir(), rel),
        join(apiUploadsDir(), base),
        join(apiUploadsDir(), 'email-imports', base),
        join(frontendEmailImportsDir(), base),
      ];
      for (const full of candidates) {
        if (!existsSync(full)) continue;
        // If already in uploads root, reuse filename
        if (full === join(apiUploadsDir(), base) || full === join(apiUploadsDir(), rel)) {
          return base.includes('/') ? basename(base) : base;
        }
        const buffer = await readFile(full);
        return saveBufferAsUpload(buffer, guessMime(base), base);
      }
    }
  } catch {
    // ignore
  }

  // Last resort: fetch if reachable (localhost API while sending)
  if (/^https?:\/\//i.test(decoded)) {
    try {
      const res = await fetch(decoded);
      if (res.ok) {
        const mime =
          res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png';
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length) return saveBufferAsUpload(buffer, mime);
      }
    } catch {
      // ignore
    }
  }

  return null;
}

function guessMime(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  return 'image/png';
}

/**
 * Prepare HTML for Gmail-friendly sending:
 * - NO CID / NO image attachments (Gmail lists those under "Attachments")
 * - data:/localhost images → files in sky-tire-api/uploads
 * - img src rewritten to absolute linked URLs: {EMAIL_IMAGE_BASE_URL}/uploads/{file}
 */
export async function prepareHtmlForEmailSend(html: string): Promise<{
  html: string;
  attachments: [];
}> {
  if (!html) return { html: '', attachments: [] };

  const base = getEmailImageBaseUrl();
  const isLocalBase = /localhost|127\.0\.0\.1/i.test(base);

  const rawCandidates: string[] = [];
  const collect = (value: string) => {
    const v = value.trim();
    if (v) rawCandidates.push(v);
  };
  for (const m of html.matchAll(/\bsrc\s*=\s*(["'])([\s\S]*?)\1/gi)) collect(m[2]);
  for (const m of html.matchAll(/\bbackground\s*=\s*(["'])([\s\S]*?)\1/gi)) collect(m[2]);
  for (const m of html.matchAll(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi)) collect(m[2]);

  const unique = [...new Set(rawCandidates.map((s) => decodeBasicEntities(s.trim())))];
  const replacements = new Map<string, string>(); // original raw -> public url

  for (const src of unique) {
    if (!isPrivateOrDataUrl(src) && !src.startsWith('cid:')) {
      // Already a normal remote URL — leave it
      continue;
    }

    // Leftover cid: from older sends — cannot resolve; skip
    if (src.startsWith('cid:')) {
      console.warn(`[mail] leftover cid reference cannot be linked: ${src}`);
      continue;
    }

    const filename = await resolveUploadFilenameFromSrc(src);
    if (!filename) {
      console.warn(`[mail] could not host image: ${src.slice(0, 100)}`);
      continue;
    }

    const publicUrl = publicUploadsUrl(filename);
    for (const raw of rawCandidates) {
      if (decodeBasicEntities(raw.trim()) === src) {
        replacements.set(raw, publicUrl);
        replacements.set(raw.trim(), publicUrl);
        replacements.set(src, publicUrl);
      }
    }
  }

  // Also rewrite any already-hosted localhost /uploads/ URLs to the public base
  let out = html;
  out = out.replace(
    /(https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?)\/uploads\/([^"'?\s]+)/gi,
    (_full, _host: string, filePath: string) => publicUploadsUrl(basename(filePath))
  );

  if (replacements.size > 0) {
    out = out.replace(/\bsrc\s*=\s*(["'])([\s\S]*?)\1/gi, (full, quote: string, value: string) => {
      const next =
        replacements.get(value) ||
        replacements.get(value.trim()) ||
        replacements.get(decodeBasicEntities(value.trim()));
      if (!next) return full;
      return `src=${quote}${next}${quote}`;
    });

    out = out.replace(
      /\bbackground\s*=\s*(["'])([\s\S]*?)\1/gi,
      (full, quote: string, value: string) => {
        const next =
          replacements.get(value) ||
          replacements.get(value.trim()) ||
          replacements.get(decodeBasicEntities(value.trim()));
        if (!next) return full;
        return `background=${quote}${next}${quote}`;
      }
    );

    out = out.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi, (full, q: string, ref: string) => {
      const next =
        replacements.get(ref) ||
        replacements.get(ref.trim()) ||
        replacements.get(decodeBasicEntities(ref.trim()));
      if (!next) return full;
      return `url(${q || '"'}${next}${q || '"'})`;
    });

    for (const [from, to] of replacements) {
      if (from && out.includes(from)) out = out.split(from).join(to);
    }
  }

  const linkedCount = replacements.size;
  console.log(
    `[mail] prepared linked images (no attachments): ${linkedCount} rewritten; base=${base}`
  );

  if (isLocalBase) {
    console.warn(
      '[mail] EMAIL_IMAGE_BASE_URL is localhost — Gmail cannot load these images. ' +
        'Set EMAIL_IMAGE_BASE_URL to a public https URL of this API (production domain or ngrok), e.g. https://abc.ngrok.io'
    );
  }

  // Never return image attachments — that creates Gmail's "N Attachments" tray
  return { html: out, attachments: [] };
}
