/** Jednorázová promo hlídání po nové dětské rezervaci — stejný model jako `pendingCalendarPromo`. */
const MAX_AGE_MS = 15 * 60 * 1000;

let pending: { id: string; ts: number } | null = null;

export function setPendingKidsWatchPromo(bookingId: string): void {
  pending = { id: String(bookingId).trim().toLowerCase(), ts: Date.now() };
}

export function peekPendingKidsWatchPromo(bookingId: string): boolean {
  const bid = String(bookingId).trim().toLowerCase();
  if (!pending) return false;
  if (pending.id !== bid) return false;
  if (Date.now() - pending.ts > MAX_AGE_MS) {
    pending = null;
    return false;
  }
  return true;
}

export function clearPendingKidsWatchPromo(): void {
  pending = null;
}
