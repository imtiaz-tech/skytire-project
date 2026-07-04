export function getUploadBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');
}

export function getUploadImageUrl(path: string | undefined | null): string {
  if (!path) return '';
  const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
  return `${getUploadBaseUrl()}/uploads/${cleanPath}`;
}
