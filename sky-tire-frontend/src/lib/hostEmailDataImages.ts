/**
 * Ensure email HTML / design JSON image URLs point at sky-tire-api/uploads
 * (same as tires, wheels, brands) — not data: or assets.unlayer.com.
 */

import axios from 'axios';
import { getUploadImageUrl } from '@/lib/uploadImageUrl';

const DATA_SRC_RE =
  /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+/gi;

/** External hosts that must be re-hosted onto our /uploads for Gmail. */
const EXTERNAL_IMAGE_HOST_RE =
  /https?:\/\/(?:assets\.unlayer\.com|cdn\.tools\.unlayer\.com|cdn\.templates\.unlayer\.com)[^"'()\s]*/gi;

function guessExt(mimeOrUrl: string): string {
  const m = mimeOrUrl.toLowerCase();
  if (m.includes('jpeg') || m.includes('jpg') || m.endsWith('.jpg') || m.endsWith('.jpeg')) {
    return 'jpg';
  }
  if (m.includes('gif') || m.endsWith('.gif')) return 'gif';
  if (m.includes('webp') || m.endsWith('.webp')) return 'webp';
  if (m.includes('svg') || m.endsWith('.svg')) return 'svg';
  if (m.includes('bmp') || m.endsWith('.bmp')) return 'bmp';
  return 'png';
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; name: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(
    dataUrl.replace(/\s+/g, '')
  );
  if (!match) return null;
  const mime = match[1];
  const b64 = match[2];
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  return {
    blob,
    name: `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${guessExt(mime)}`,
  };
}

async function remoteUrlToBlob(url: string): Promise<{ blob: Blob; name: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mime = res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png';
    const blob = await res.blob();
    if (!blob.size) return null;
    const pathPart = url.split('?')[0].split('/').pop() || 'image';
    const ext = guessExt(mime.includes('image/') ? mime : pathPart);
    const safe = pathPart.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/\.[a-zA-Z0-9]+$/, '');
    return {
      blob,
      name: `email-${Date.now()}-${safe || 'image'}.${ext}`,
    };
  } catch {
    return null;
  }
}

async function uploadBlobs(
  items: { blob: Blob; name: string; source: string }[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (items.length === 0) return map;

  const BATCH = 6;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const formData = new FormData();
    for (const item of batch) {
      formData.append('files', item.blob, item.name);
    }
    const res = await axios.post('/api/admin/email-templates/import-assets', formData, {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    const uploaded = (res.data?.uploaded || []) as {
      originalName: string;
      filename: string;
      url: string;
    }[];

    for (let j = 0; j < batch.length; j++) {
      const match =
        uploaded.find((u) => u.originalName === batch[j].name) || uploaded[j];
      if (!match) continue;
      const url = match.filename ? getUploadImageUrl(match.filename) : match.url;
      if (url) map.set(batch[j].source, url);
    }
  }
  return map;
}

function collectDataUrls(text: string): string[] {
  const found = text.match(DATA_SRC_RE) || [];
  return [...new Set(found.map((s) => s.replace(/\s+/g, '')))];
}

function collectExternalImageUrls(text: string): string[] {
  const found = text.match(EXTERNAL_IMAGE_HOST_RE) || [];
  return [...new Set(found)];
}

function rewriteMappedUrls(text: string, urlMap: Map<string, string>): string {
  if (urlMap.size === 0) return text;

  let out = text.replace(
    /(\b(?:src|background)\s*=\s*)(["'])([\s\S]*?)\2/gi,
    (full, prefix: string, quote: string, value: string) => {
      const trimmed = value.trim();
      const dataKey = trimmed.replace(/\s+/g, '');
      const url =
        urlMap.get(trimmed) ||
        urlMap.get(dataKey) ||
        (dataKey.startsWith('data:image') ? urlMap.get(dataKey) : undefined);
      if (!url) return full;
      return `${prefix}${quote}${url}${quote}`;
    }
  );

  out = out.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi, (full, q: string, ref: string) => {
    const key = ref.trim().replace(/\s+/g, '');
    const url = urlMap.get(ref.trim()) || urlMap.get(key);
    if (!url) return full;
    return `url(${q || '"'}${url}${q || '"'})`;
  });

  // Replace remaining exact source strings (design JSON, etc.)
  for (const [from, to] of urlMap) {
    if (from && out.includes(from)) {
      out = out.split(from).join(to);
    }
  }

  out = out.replace(DATA_SRC_RE, (match) => {
    const key = match.replace(/\s+/g, '');
    return urlMap.get(key) || match;
  });

  return out;
}

/**
 * Re-host data: and Unlayer CDN images onto /uploads (product-style URLs).
 */
export async function hostDataImagesInHtml(html: string): Promise<{
  html: string;
  converted: number;
}> {
  const dataUrls = collectDataUrls(html);
  const externalUrls = collectExternalImageUrls(html);
  if (dataUrls.length === 0 && externalUrls.length === 0) {
    return { html, converted: 0 };
  }

  const items: { blob: Blob; name: string; source: string }[] = [];

  for (const dataUrl of dataUrls) {
    const parsed = dataUrlToBlob(dataUrl);
    if (!parsed) continue;
    items.push({ ...parsed, source: dataUrl });
  }

  for (const url of externalUrls) {
    const parsed = await remoteUrlToBlob(url);
    if (!parsed) continue;
    items.push({ ...parsed, source: url });
  }

  if (items.length === 0) return { html, converted: 0 };

  const urlMap = await uploadBlobs(items);
  if (urlMap.size === 0) {
    throw new Error('Failed to upload email images to the server. Please try saving again.');
  }
  return { html: rewriteMappedUrls(html, urlMap), converted: urlMap.size };
}

/**
 * Same re-hosting for Unlayer design JSON.
 */
export async function hostDataImagesInDesign(
  design: Record<string, unknown>
): Promise<{ design: Record<string, unknown>; converted: number }> {
  const json = JSON.stringify(design);
  const dataUrls = collectDataUrls(json);
  const externalUrls = collectExternalImageUrls(json);

  if (dataUrls.length === 0 && externalUrls.length === 0) {
    return { design, converted: 0 };
  }

  const items: { blob: Blob; name: string; source: string }[] = [];

  for (const dataUrl of dataUrls) {
    const parsed = dataUrlToBlob(dataUrl);
    if (!parsed) continue;
    items.push({ ...parsed, source: dataUrl });
  }
  for (const url of externalUrls) {
    const parsed = await remoteUrlToBlob(url);
    if (!parsed) continue;
    items.push({ ...parsed, source: url });
  }

  if (items.length === 0) return { design, converted: 0 };

  const urlMap = await uploadBlobs(items);
  if (urlMap.size === 0) {
    throw new Error('Failed to upload email images to the server. Please try saving again.');
  }

  const rewritten = rewriteMappedUrls(json, urlMap);
  try {
    return {
      design: JSON.parse(rewritten) as Record<string, unknown>,
      converted: urlMap.size,
    };
  } catch {
    return { design, converted: 0 };
  }
}
