import { describe, expect, it } from 'vitest';

import {
  APP_SMART_DOWNLOAD_HOME_ROUTE,
  isKnownAppRoute,
  isSmartDownloadPath,
  normalizeIncomingDeepLinkPath,
  resolveIncomingDeepLinkRoute,
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

  it('recognizes in-app routes', () => {
    expect(isKnownAppRoute('/real-barber')).toBe(true);
    expect(isKnownAppRoute('/screens/booking-detail')).toBe(true);
    expect(isKnownAppRoute('/barber-detail')).toBe(true);
    expect(isKnownAppRoute('/pobocky/modrany')).toBe(false);
  });

  it('falls back unknown web paths to home instead of passing them through', () => {
    expect(resolveIncomingDeepLinkRoute('/pobocky/modrany')).toBe(APP_SMART_DOWNLOAD_HOME_ROUTE);
    expect(resolveIncomingDeepLinkRoute('/en/pobocky/modrany')).toBe(APP_SMART_DOWNLOAD_HOME_ROUTE);
    expect(resolveIncomingDeepLinkRoute('https://realbarber.cz/pobocky/modrany')).toBe(
      APP_SMART_DOWNLOAD_HOME_ROUTE
    );
  });

  it('passes through known app routes', () => {
    expect(resolveIncomingDeepLinkRoute('/real-barber')).toBe('/real-barber');
    expect(resolveIncomingDeepLinkRoute('/screens/login')).toBe('/screens/login');
    expect(resolveIncomingDeepLinkRoute('realbarber://barber-detail')).toBe('/barber-detail');
  });

  it('preserves query params for known app routes', () => {
    expect(
      resolveIncomingDeepLinkRoute('realbarber://screens/booking-detail?id=abc-123')
    ).toBe('/screens/booking-detail?id=abc-123');
    expect(
      resolveIncomingDeepLinkRoute('/screens/booking-detail?id=res-1&openReview=1')
    ).toBe('/screens/booking-detail?id=res-1&openReview=1');
  });

  it('drops query params for unknown web paths', () => {
    expect(resolveIncomingDeepLinkRoute('/pobocky/modrany?foo=bar')).toBe(
      APP_SMART_DOWNLOAD_HOME_ROUTE
    );
  });
});
