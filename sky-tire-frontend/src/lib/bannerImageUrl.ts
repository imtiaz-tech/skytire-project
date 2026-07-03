export function getUploadBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');
}

export function getBannerImageUrl(filename: string): string {
  if (!filename) return '';
  return `${getUploadBaseUrl()}/uploads/banners/${filename}`;
}
