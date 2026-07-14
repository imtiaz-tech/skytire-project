/**
 * YouTube URL helpers for Wire Wheel (and other) product media.
 */

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

/**
 * Extract an 11-character YouTube video ID from common URL formats.
 */
export function extractYouTubeVideoId(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  // youtu.be/<id>
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return isValidYouTubeId(id) ? id : null;
  }

  // youtube.com/watch?v=<id>
  const vParam = url.searchParams.get('v');
  if (vParam && isValidYouTubeId(vParam)) return vParam;

  // youtube.com/embed/<id> | /shorts/<id> | /live/<id> | /v/<id>
  const pathMatch = url.pathname.match(/^\/(embed|shorts|live|v)\/([a-zA-Z0-9_-]{11})/);
  if (pathMatch) return pathMatch[2];

  return null;
}

function isValidYouTubeId(id: string | undefined | null): boolean {
  return Boolean(id && /^[a-zA-Z0-9_-]{11}$/.test(id));
}

/**
 * Returns true when the URL is a valid YouTube watch/share/embed URL.
 * Empty string is treated as valid (field is optional).
 */
export function isValidYouTubeUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return true;
  return extractYouTubeVideoId(trimmed) !== null;
}

/**
 * Convert a YouTube URL into an embeddable iframe src.
 */
export function getYouTubeEmbedUrl(rawUrl: string): string | null {
  const id = extractYouTubeVideoId(rawUrl);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

/** Allowed MIME types for a single product video upload. */
export const WIRE_WHEEL_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/webm',
] as const;

export const WIRE_WHEEL_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'] as const;

export function isAllowedWireWheelVideoFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const hasExt = WIRE_WHEEL_VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasMime =
    !file.type ||
    (WIRE_WHEEL_VIDEO_MIME_TYPES as readonly string[]).includes(file.type);
  return hasExt && hasMime;
}
