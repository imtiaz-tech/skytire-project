/**
 * Helpers for importing email designs into Unlayer (react-email-editor).
 *
 * - Unlayer design JSON → loadDesign as-is
 * - Gmail/Yahoo HTML → extract MIME HTML, then htmlToUnlayerDesign() for DnD blocks
 */

import {
  htmlToUnlayerDesign,
  summarizeConvertedDesign,
} from '@/lib/htmlToUnlayerDesign';
import type { UnlayerDesign } from '@/lib/unlayerDesignTypes';

export { htmlToUnlayerDesign, summarizeConvertedDesign };
export type { UnlayerDesign };

export function isValidUnlayerDesign(
  value: unknown
): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const design = value as Record<string, unknown>;
  if ('classic' in design && design.classic === true) return false;
  const body = design.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  return Array.isArray((body as { rows?: unknown }).rows);
}

export function parseUnlayerDesignJson(raw: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      'Invalid JSON file. Please select a valid Unlayer design JSON export.'
    );
  }
  if (!isValidUnlayerDesign(parsed)) {
    throw new Error(
      'This JSON is not a valid Unlayer design. Export design JSON from Unlayer (body.rows required).'
    );
  }
  return parsed;
}

function looksLikeRawEmailSource(text: string): boolean {
  const sample = text.slice(0, 4000).toLowerCase();
  return (
    sample.includes('delivered-to:') ||
    sample.includes('received:') ||
    sample.includes('mime-version:') ||
    sample.includes('content-type: multipart/') ||
    sample.includes('dkim-signature:') ||
    sample.includes('message-id:') ||
    /^from:\s+/im.test(text.slice(0, 2000))
  );
}

function looksLikeHtmlDocument(text: string): boolean {
  const sample = text.slice(0, 4000).toLowerCase();
  return (
    sample.includes('<html') ||
    sample.includes('<!doctype html') ||
    sample.includes('<body') ||
    sample.includes('<table') ||
    sample.includes('<div')
  );
}

function decodeQuotedPrintable(input: string): string {
  const normalized = input.replace(/=\r?\n/g, '');
  return normalized.replace(/=([0-9A-Fa-f]{2})/g, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function decodeBase64Utf8(input: string): string {
  const cleaned = input.replace(/\s+/g, '');
  if (typeof atob === 'function') {
    const binary = atob(cleaned);
    try {
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return new TextDecoder('utf-8').decode(bytes);
    } catch {
      return binary;
    }
  }
  return Buffer.from(cleaned, 'base64').toString('utf-8');
}

function getHeaderValue(headers: string, name: string): string | null {
  const re = new RegExp(
    `^${name}:\\s*([^\\r\\n]*(?:\\r?\\n[ \\t][^\\r\\n]*)*)`,
    'im'
  );
  const match = headers.match(re);
  if (!match) return null;
  return match[1].replace(/\r?\n[ \t]+/g, ' ').trim();
}

function splitMimeParts(raw: string, boundary: string): string[] {
  const escaped = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const splitter = new RegExp(`(?:^|\\r?\\n)--${escaped}(?:--)?(?=\\r?\\n|$)`);
  return raw
    .split(splitter)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith('--'));
}

function extractHtmlFromMimePart(part: string): string | null {
  const sep = part.search(/\r?\n\r?\n/);
  if (sep < 0) return null;
  const headers = part.slice(0, sep);
  let body = part.slice(sep).replace(/^\r?\n\r?\n/, '');

  const contentType = (getHeaderValue(headers, 'Content-Type') || '').toLowerCase();
  if (!contentType.includes('text/html')) return null;

  const encoding = (
    getHeaderValue(headers, 'Content-Transfer-Encoding') || ''
  ).toLowerCase();

  if (encoding.includes('base64')) {
    body = decodeBase64Utf8(body);
  } else if (encoding.includes('quoted-printable')) {
    body = decodeQuotedPrintable(body);
  }

  return body.trim() || null;
}

function extractWithBoundary(
  raw: string,
  boundary: string,
  depth = 0
): string | null {
  if (depth > 8) return null;

  const parts = splitMimeParts(raw, boundary);
  let nestedHtml: string | null = null;

  for (const part of parts) {
    const partHeadersEnd = part.search(/\r?\n\r?\n/);
    const partHeaders = partHeadersEnd >= 0 ? part.slice(0, partHeadersEnd) : part;
    const partType = (getHeaderValue(partHeaders, 'Content-Type') || '').toLowerCase();

    if (partType.includes('multipart/')) {
      const nestedBoundary = partType.match(/boundary="?([^";\s]+)"?/i)?.[1];
      // Only recurse into a *different* nested boundary (avoid looping on preamble)
      if (nestedBoundary && nestedBoundary !== boundary) {
        const nested = extractWithBoundary(part, nestedBoundary, depth + 1);
        if (nested) nestedHtml = nested;
      }
      continue;
    }

    const html = extractHtmlFromMimePart(part);
    if (html) return html;
  }

  return nestedHtml;
}

function extractHtmlFromMultipart(raw: string): string | null {
  const headerEnd = raw.search(/\r?\n\r?\n/);
  const headers = headerEnd >= 0 ? raw.slice(0, headerEnd) : raw.slice(0, 8000);
  const contentType = getHeaderValue(headers, 'Content-Type') || '';
  const boundaryMatch =
    contentType.match(/boundary="?([^";\s]+)"?/i) ||
    raw.slice(0, 12000).match(/boundary="?([^";\s\r\n]+)"?/i);
  if (!boundaryMatch) return null;
  return extractWithBoundary(raw, boundaryMatch[1]);
}

/**
 * Turn pasted Gmail "Show original" / .eml / raw MIME (or plain HTML) into
 * clean HTML that can render like the visual email.
 */
export function extractEmailHtml(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error(
      'Paste is empty. Copy the email HTML (or Gmail Show original) and try again.'
    );
  }

  if (looksLikeRawEmailSource(trimmed)) {
    const fromMime = extractHtmlFromMultipart(trimmed);
    if (fromMime && looksLikeHtmlDocument(fromMime)) {
      return fromMime;
    }

    const htmlBlock = trimmed.match(/<html[\s\S]*?<\/html>/i);
    if (htmlBlock) {
      return decodeQuotedPrintable(htmlBlock[0]);
    }

    throw new Error(
      'Could not find the HTML body in this paste. Paste the full Gmail “Show original” source, or copy HTML from the email (Inspect → message iframe).'
    );
  }

  if (looksLikeHtmlDocument(trimmed)) {
    return trimmed;
  }

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  throw new Error(
    'This does not look like email HTML. Paste the HTML body (not only headers), or upload an .html file.'
  );
}

/**
 * Convert imported email HTML into Unlayer design JSON for loadDesign().
 * Uses htmlToUnlayerDesign for drag-and-drop blocks; falls back to a single
 * HTML block if conversion fails so content is never lost.
 */
export function designFromImportedHtml(html: string): Record<string, unknown> {
  const cleaned = extractEmailHtml(html);

  try {
    return htmlToUnlayerDesign(cleaned) as unknown as Record<string, unknown>;
  } catch {
    return designFromImportedHtmlAsSingleBlock(cleaned);
  }
}

/** Legacy single-block fallback (visual HTML only). */
export function designFromImportedHtmlAsSingleBlock(
  cleanedHtml: string
): Record<string, unknown> {
  const cleaned = cleanedHtml.trim();
  if (!cleaned) {
    throw new Error('HTML content is empty.');
  }

  return {
    counters: {
      u_row: 1,
      u_column: 1,
      u_content_html: 1,
    },
    body: {
      id: 'u_body',
      rows: [
        {
          id: 'u_row_1',
          cells: [1],
          columns: [
            {
              id: 'u_column_1',
              contents: [
                {
                  id: 'u_content_html_1',
                  type: 'html',
                  values: {
                    html: cleaned,
                    containerPadding: '0px',
                    anchor: '',
                    _meta: {
                      htmlID: 'u_content_html_1',
                      htmlClassNames: 'u_content_html',
                    },
                    selectable: true,
                    draggable: true,
                    duplicatable: true,
                    deletable: true,
                  },
                },
              ],
              values: {
                backgroundColor: '',
                padding: '0px',
                border: {},
                _meta: {
                  htmlID: 'u_column_1',
                  htmlClassNames: 'u_column',
                },
              },
            },
          ],
          values: {
            displayCondition: null,
            columns: false,
            backgroundColor: '',
            columnsBackgroundColor: '',
            backgroundImage: {
              url: '',
              fullWidth: true,
              repeat: false,
              center: true,
              cover: false,
            },
            padding: '0px',
            anchor: '',
            hideDesktop: false,
            hideMobile: false,
            noStackMobile: false,
            _meta: {
              htmlID: 'u_row_1',
              htmlClassNames: 'u_row',
            },
            selectable: true,
            draggable: true,
            duplicatable: true,
            deletable: true,
          },
        },
      ],
      values: {
        textColor: '#000000',
        backgroundColor: '#ffffff',
        backgroundImage: {
          url: '',
          fullWidth: true,
          repeat: false,
          center: true,
          cover: false,
        },
        contentWidth: '600px',
        contentAlign: 'center',
        fontFamily: {
          label: 'Arial',
          value: 'arial,helvetica,sans-serif',
        },
        preheaderText: '',
        linkStyle: {
          body: true,
          linkColor: '#0000ee',
          linkHoverColor: '#0000ee',
          linkUnderline: true,
          linkHoverUnderline: true,
        },
        _meta: {
          htmlID: 'u_body',
          htmlClassNames: 'u_body',
        },
      },
    },
    schemaVersion: 16,
  };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read the selected file'));
    reader.readAsText(file);
  });
}
