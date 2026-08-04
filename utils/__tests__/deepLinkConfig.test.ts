import { describe, expect, it } from 'vitest';

import {
  APP_SMART_DOWNLOAD_HOME_ROUTE,
  isSmartDownloadPath,
  normalizeIncomingDeepLinkPath,
  resolveSmartDownloadRoute,
} from '@/constants/deepLinkConfig';

describe('deepLinkConfig', () => {
  it('normalizes full URL to pathname', () => {
    expect(
      normalizeIncomingDeepLinkPath('https://realbarber.cz/aplikace/stahnout?utm_source=qr')
    ).toBe('/aplikace/stahnout');
  });

  it('recognizes smart download paths with and without trailing slash', () => {
    expect(isSmartDownloadPath('/aplikace/stahnout')).toBe(true);
    expect(isSmartDownloadPath('/aplikace/stahnout/')).toBe(true);
    expect(isSmartDownloadPath('/aplikace/jine')).toBe(false);
  });

  it('maps smart download to home route', () => {
    expect(resolveSmartDownloadRoute('/aplikace/stahnout')).toBe(APP_SMART_DOWNLOAD_HOME_ROUTE);
    expect(resolveSmartDownloadRoute('/unknown')).toBeNull();
  });
});
