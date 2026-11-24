/**
 * Resolves a portal asset URL (e.g. a logo path stored in the DB) to a full
 * absolute URL by prepending the backend base URL when necessary.
 *
 * Examples:
 *   resolvePortalAssetUrl('/uploads/logo.png')
 *     → 'http://localhost:5001/uploads/logo.png'
 *
 *   resolvePortalAssetUrl('https://example.com/logo.png')
 *     → 'https://example.com/logo.png'   (already absolute, left as-is)
 *
 *   resolvePortalAssetUrl(undefined)
 *     → undefined
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Strip the /api suffix to get the server root (e.g. http://localhost:5001)
const SERVER_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export function resolvePortalAssetUrl(
  assetUrl: string | null | undefined
): string | undefined {
  if (!assetUrl) return undefined;

  // Already an absolute URL or data/blob URI — return as-is
  if (/^(https?:\/\/|data:|blob:)/i.test(assetUrl)) return assetUrl;

  // Relative path — prepend the server origin
  const separator = assetUrl.startsWith('/') ? '' : '/';
  return `${SERVER_ORIGIN}${separator}${assetUrl}`;
}
