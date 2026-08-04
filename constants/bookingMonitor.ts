/** Produční Next web — BFF (booking monitor, čekací listina, …). */
export const WEB_BFF_ORIGIN = (
  process.env.EXPO_PUBLIC_WEB_ORIGIN ?? 'https://seo-starter-eta-wine.vercel.app'
).replace(/\/$/, '');

/** @deprecated Prefer `WEB_BFF_ORIGIN`. */
export const BOOKING_MONITOR_WEB_ORIGIN = WEB_BFF_ORIGIN;
