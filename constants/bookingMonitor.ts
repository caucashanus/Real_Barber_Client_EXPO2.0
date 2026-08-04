/** Preview / staging web (BFF) — dokud není v provozu realbarber.cz. */
export const SEO_STARTER_WEB_ORIGIN = 'https://seo-starter-eta-wine.vercel.app';

/** Next.js BFF — nearest branch, booking monitor, waitlist, … */
export const WEB_BFF_ORIGIN = (
  process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim() || SEO_STARTER_WEB_ORIGIN
).replace(/\/$/, '');

/** @deprecated Prefer `WEB_BFF_ORIGIN`. */
export const BOOKING_MONITOR_WEB_ORIGIN = WEB_BFF_ORIGIN;
