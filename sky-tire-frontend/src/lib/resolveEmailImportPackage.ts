/**
 * Resolve Unlayer / email HTML export packages (ZIP with index.html + images/,
 * or standalone HTML / design JSON) into importable HTML or design JSON.
 */

import JSZip from 'jszip';
import axios from 'axios';
import { isValidUnlayerDesign, parseUnlayerDesignJson } from '@/lib/emailTemplateImport';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i;

export type ResolvedImport =
  | { kind: 'design'; design: Record<string, unknown>; message?: string }
  | { kind: 'html'; html: string; message?: string; imagesRewritten: number };

function basename(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || path;
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}

function isImagePath(path: string): boolean {
  return IMAGE_EXT.test(path);
}

function guessMime(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  return 'application/octet-stream';
}

function mapImageUrls(
  images: { path: string; name: string }[],
  resolveUrl: (img: { path: string; name: string }, index: number) => string | undefined,
  htmlDir: string
): Map<string, string> {
  const urlMap = new Map<string, string>();

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const url = resolveUrl(img, i);
    if (!url) continue;

    urlMap.set(normalizePath(img.path), url);
    urlMap.set(normalizePath(img.path).toLowerCase(), url);
    urlMap.set(img.name.toLowerCase(), url);
    urlMap.set(`images/${img.name}`.toLowerCase(), url);
    urlMap.set(`images/${img.name}`, url);

    const rel =
      htmlDir && img.path.startsWith(`${htmlDir}/`)
        ? img.path.slice(htmlDir.length + 1)
        : img.path;

    urlMap.set(normalizePath(rel), url);
    urlMap.set(normalizePath(rel).toLowerCase(), url);
    urlMap.set(`./${normalizePath(rel)}`, url);
  }

  return urlMap;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const b64 = btoa(binary);
  return `data:${blob.type || 'application/octet-stream'};base64,${b64}`;
}

async function imagesToDataUrlMap(
  images: { path: string; blob: Blob; name: string }[],
  htmlDir: string
): Promise<Map<string, string>> {
  const dataUrls: string[] = [];
  for (const img of images) {
    dataUrls.push(await blobToDataUrl(img.blob));
  }
  return mapImageUrls(images, (_img, i) => dataUrls[i], htmlDir);
}

async function uploadImageBlobs(
  images: { path: string; blob: Blob; name: string }[],
  htmlDir: string
): Promise<Map<string, string>> {
  if (images.length === 0) return new Map();

  const formData = new FormData();
  for (const img of images) {
    formData.append('files', img.blob, img.name);
  }

  // Do NOT set Content-Type manually — the browser must add the multipart boundary.
  const res = await axios.post('/api/admin/email-templates/import-assets', formData, {
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  const uploaded = (res.data?.uploaded || []) as {
    originalName: string;
    url: string;
  }[];

  if (uploaded.length === 0) {
    throw new Error('No files provided');
  }

  // Unlayer editor runs in a cross-origin iframe — relative /api URLs would resolve
  // against unlayer.com. Always use absolute same-origin URLs (or data: fallback).
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const absolute = uploaded.map((u) => ({
    ...u,
    url: u.url.startsWith('/') ? `${origin}${u.url}` : u.url,
  }));

  return mapImageUrls(
    images,
    (img, i) =>
      absolute.find((u) => u.originalName === img.name)?.url || absolute[i]?.url,
    htmlDir
  );
}

/**
 * Rewrite relative / local image src, CSS url(), and background= attrs.
 */
export function rewriteHtmlImageSources(
  html: string,
  urlMap: Map<string, string>
): { html: string; rewritten: number } {
  if (urlMap.size === 0) return { html, rewritten: 0 };

  let rewritten = 0;

  const resolveRef = (raw: string): string | null => {
    const cleaned = raw.trim().replace(/^['"]|['"]$/g, '');
    if (
      !cleaned ||
      cleaned.startsWith('data:') ||
      cleaned.startsWith('http://') ||
      cleaned.startsWith('https://') ||
      cleaned.startsWith('//') ||
      cleaned.startsWith('/api/')
    ) {
      return null;
    }
    const norm = normalizePath(cleaned).replace(/^\//, '');
    const byPath = urlMap.get(norm) || urlMap.get(norm.toLowerCase());
    if (byPath) return byPath;
    const byBase = urlMap.get(basename(norm).toLowerCase());
    if (byBase) return byBase;
    return urlMap.get(`images/${basename(norm)}`.toLowerCase()) || null;
  };

  let out = html.replace(
    /(\bsrc\s*=\s*)(["'])([^"']+)\2/gi,
    (full, prefix: string, quote: string, src: string) => {
      const resolved = resolveRef(src);
      if (!resolved) return full;
      rewritten += 1;
      return `${prefix}${quote}${resolved}${quote}`;
    }
  );

  out = out.replace(
    /(\bbackground\s*=\s*)(["'])([^"']+)\2/gi,
    (full, prefix: string, quote: string, src: string) => {
      const resolved = resolveRef(src);
      if (!resolved) return full;
      rewritten += 1;
      return `${prefix}${quote}${resolved}${quote}`;
    }
  );

  out = out.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi, (full, _q: string, ref: string) => {
    const resolved = resolveRef(ref);
    if (!resolved) return full;
    rewritten += 1;
    return `url("${resolved}")`;
  });

  return { html: out, rewritten };
}

async function resolveImageUrlMap(
  images: { path: string; blob: Blob; name: string }[],
  htmlDir: string
): Promise<{ urlMap: Map<string, string>; mode: 'upload' | 'data-url' | 'none' }> {
  if (images.length === 0) return { urlMap: new Map(), mode: 'none' };

  // Prefer embedded data URLs so images always render inside Unlayer's cross-origin iframe.
  // Fall back to uploaded absolute URLs only if data-URL encoding fails.
  try {
    const urlMap = await imagesToDataUrlMap(images, htmlDir);
    if (urlMap.size > 0) return { urlMap, mode: 'data-url' };
  } catch (err) {
    console.warn('Email import data-URL embed failed, trying upload:', err);
  }

  try {
    const urlMap = await uploadImageBlobs(images, htmlDir);
    if (urlMap.size > 0) return { urlMap, mode: 'upload' };
  } catch (err) {
    console.warn('Email import image upload failed:', err);
  }

  return { urlMap: new Map(), mode: 'none' };
}

async function resolveZipPackage(file: File): Promise<ResolvedImport> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.keys(zip.files).filter((p) => !zip.files[p].dir);

  // Prefer Unlayer design JSON if present
  const jsonCandidates = entries.filter(
    (p) =>
      /\.json$/i.test(p) &&
      !/package(-lock)?\.json$/i.test(basename(p)) &&
      !/node_modules\//i.test(p)
  );

  for (const jsonPath of jsonCandidates) {
    try {
      const text = await zip.files[jsonPath].async('string');
      const design = parseUnlayerDesignJson(text);
      return {
        kind: 'design',
        design,
        message: `Loaded Unlayer design JSON from ${basename(jsonPath)}`,
      };
    } catch {
      // try next
    }
  }

  for (const jsonPath of jsonCandidates) {
    try {
      const text = await zip.files[jsonPath].async('string');
      const parsed = JSON.parse(text);
      if (isValidUnlayerDesign(parsed)) {
        return {
          kind: 'design',
          design: parsed,
          message: `Loaded Unlayer design from ${basename(jsonPath)}`,
        };
      }
      if (parsed?.design && isValidUnlayerDesign(parsed.design)) {
        return {
          kind: 'design',
          design: parsed.design,
          message: `Loaded Unlayer design from ${basename(jsonPath)}`,
        };
      }
    } catch {
      // continue
    }
  }

  const htmlPath =
    entries.find((p) => /(^|\/)index\.html?$/i.test(p)) ||
    entries.find((p) => /\.html?$/i.test(p));

  if (!htmlPath) {
    throw new Error(
      'ZIP has no index.html / .html or Unlayer design JSON. Export HTML or JSON from Unlayer and try again.'
    );
  }

  const html = await zip.files[htmlPath].async('string');
  const htmlDir = htmlPath.includes('/')
    ? htmlPath.slice(0, htmlPath.lastIndexOf('/'))
    : '';

  const imageEntries = entries.filter((p) => isImagePath(p));

  const images: { path: string; blob: Blob; name: string }[] = [];
  for (const path of imageEntries) {
    const data = await zip.files[path].async('uint8array');
    const name = basename(path);
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    const blob = new Blob([copy], { type: guessMime(name) });
    images.push({ path: normalizePath(path), blob, name });
  }

  const { urlMap, mode } = await resolveImageUrlMap(images, htmlDir);
  const { html: rewrittenHtml, rewritten } = rewriteHtmlImageSources(html, urlMap);

  let message: string;
  if (rewritten > 0 && mode === 'upload') {
    message = `Imported HTML package with ${rewritten} image(s) uploaded`;
  } else if (rewritten > 0 && mode === 'data-url') {
    message = `Imported HTML package with ${rewritten} embedded image(s)`;
  } else if (images.length === 0) {
    message = 'Imported HTML (no local images found in ZIP)';
  } else {
    message =
      'Imported HTML but could not map some image paths — check images/ folder';
  }

  return {
    kind: 'html',
    html: rewrittenHtml,
    imagesRewritten: rewritten,
    message,
  };
}

async function resolveHtmlWithOptionalSidecarImages(
  htmlFile: File,
  imageFiles: File[] = []
): Promise<ResolvedImport> {
  const html = await htmlFile.text();
  if (imageFiles.length === 0) {
    const hasRelative =
      /\bsrc\s*=\s*["'](?!https?:|data:|\/\/|\/api\/)[^"']+/i.test(html) ||
      /url\(\s*['"]?(?!https?:|data:|\/\/|\/api\/)[^)'"]+/i.test(html);
    return {
      kind: 'html',
      html,
      imagesRewritten: 0,
      message: hasRelative
        ? 'HTML has relative image paths. Upload the ZIP (HTML + images folder) so images display.'
        : undefined,
    };
  }

  const images = imageFiles.map((f) => ({
    path: f.name,
    blob: f as Blob,
    name: f.name,
  }));
  const { urlMap, mode } = await resolveImageUrlMap(images, '');
  const { html: rewrittenHtml, rewritten } = rewriteHtmlImageSources(html, urlMap);

  return {
    kind: 'html',
    html: rewrittenHtml,
    imagesRewritten: rewritten,
    message:
      rewritten > 0
        ? mode === 'upload'
          ? `Imported HTML with ${rewritten} image(s) uploaded`
          : `Imported HTML with ${rewritten} embedded image(s)`
        : 'Imported HTML but could not map image paths — try a ZIP of the whole folder',
  };
}

/**
 * Resolve a user-selected import file (.zip / .html / .json).
 */
export async function resolveEmailImportFile(file: File): Promise<ResolvedImport> {
  return resolveEmailImportFiles([file]);
}

/**
 * Resolve one or more selected files (e.g. index.html + images selected together).
 */
export async function resolveEmailImportFiles(files: File[]): Promise<ResolvedImport> {
  if (files.length === 0) {
    throw new Error('No file selected');
  }

  if (files.length === 1) {
    const file = files[0];
    const name = file.name.toLowerCase();

    if (
      name.endsWith('.zip') ||
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed'
    ) {
      return resolveZipPackage(file);
    }

    if (name.endsWith('.json') || file.type === 'application/json') {
      const text = await file.text();
      const design = parseUnlayerDesignJson(text);
      return { kind: 'design', design, message: 'Loaded Unlayer design JSON' };
    }

    if (name.endsWith('.html') || name.endsWith('.htm') || file.type === 'text/html') {
      return resolveHtmlWithOptionalSidecarImages(file);
    }

    throw new Error(
      'Unsupported file. Use a Unlayer ZIP export (HTML + images), .html, or design .json file.'
    );
  }

  const zip = files.find(
    (f) =>
      f.name.toLowerCase().endsWith('.zip') ||
      f.type === 'application/zip' ||
      f.type === 'application/x-zip-compressed'
  );
  if (zip) return resolveZipPackage(zip);

  const json = files.find(
    (f) => f.name.toLowerCase().endsWith('.json') || f.type === 'application/json'
  );
  if (json) {
    const text = await json.text();
    const design = parseUnlayerDesignJson(text);
    return { kind: 'design', design, message: 'Loaded Unlayer design JSON' };
  }

  const htmlFile = files.find(
    (f) => /\.html?$/i.test(f.name) || f.type === 'text/html'
  );
  if (!htmlFile) {
    throw new Error(
      'Select index.html plus its images folder files, or a single ZIP containing both.'
    );
  }

  const imageFiles = files.filter((f) => IMAGE_EXT.test(f.name));
  return resolveHtmlWithOptionalSidecarImages(htmlFile, imageFiles);
}
