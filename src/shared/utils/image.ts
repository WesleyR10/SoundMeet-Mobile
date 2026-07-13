const EXTENSION_MIME: Record<string, string> = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
};

export function inferImageMimeType(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase().split('?')[0] ?? '';
  return EXTENSION_MIME[ext] ?? 'image/jpeg';
}

export function inferImageFileName(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase().split('?')[0] ?? 'jpg';
  const safeExt = EXTENSION_MIME[ext] ? ext : 'jpg';
  return `avatar.${safeExt}`;
}
