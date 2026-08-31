/** Produkční web (Next.js BFF — waitlist, booking monitor, nearest branch, …). */
export const PRODUCTION_WEB_ORIGIN = 'https://realbarber.cz';

/** @deprecated Používej `PRODUCTION_WEB_ORIGIN`. Ponecháno pro starší env fallbacky. */
export const SEO_STARTER_WEB_ORIGIN = PRODUCTION_WEB_ORIGIN;

/** Next.js BFF — nearest branch, booking monitor, waitlist, … */
export const WEB_BFF_ORIGIN = (
  process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim() || PRODUCTION_WEB_ORIGIN
).replace(/\/$/, '');

/** @deprecated Prefer `WEB_BFF_ORIGIN`. */
export const BOOKING_MONITOR_WEB_ORIGIN = WEB_BFF_ORIGIN;
