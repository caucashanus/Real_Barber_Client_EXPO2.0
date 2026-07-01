/** Jednorázové otevření notifikace po tapu na push (cold start / navigace). */
const MAX_AGE_MS = 5 * 60 * 1000;

let pending: { id: string; ts: number } | null = null;

export function setPendingNotificationOpen(notificationId: string): void {
  const id = String(notificationId).trim();
  if (!id) return;
  pending = { id, ts: Date.now() };
}

export function peekPendingNotificationOpen(): string | null {
  if (!pending) return null;
  if (Date.now() - pending.ts > MAX_AGE_MS) {
    pending = null;
    return null;
  }
  return pending.id;
}

export function consumePendingNotificationOpen(): string | null {
  const id = peekPendingNotificationOpen();
  pending = null;
  return id;
}
