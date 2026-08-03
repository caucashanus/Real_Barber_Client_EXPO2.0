/** Produční Next web — BFF pro POST /api/booking-monitor. */
export const BOOKING_MONITOR_WEB_ORIGIN = (
  process.env.EXPO_PUBLIC_WEB_ORIGIN ?? 'https://seo-starter-eta-wine.vercel.app'
).replace(/\/$/, '');
