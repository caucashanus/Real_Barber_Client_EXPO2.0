function normalizeLinkHost(hostname: string): string {
  return hostname.replace(/^www\./, '').toLowerCase();
}

/** Google Maps, Waze, Apple Maps — otevřít systémem (nativní app), ne in-app browser. */
export function isNativeExternalAppLink(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  const scheme = trimmed.split(':')[0]?.toLowerCase() ?? '';
  if (scheme === 'geo' || scheme === 'comgooglemaps' || scheme === 'waze' || scheme === 'maps') {
    return true;
  }

  if (scheme !== 'http' && scheme !== 'https') return false;

  try {
    const parsed = new URL(trimmed);
    const host = normalizeLinkHost(parsed.hostname);
    const path = parsed.pathname.toLowerCase();

    if (host === 'maps.app.goo.gl') return true;
    if (host === 'goo.gl' && path.includes('maps')) return true;
    if (host === 'maps.apple.com') return true;
    if (host.endsWith('waze.com')) return true;
    if (host.endsWith('google.com') && (path.includes('/maps') || host.startsWith('maps.'))) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
