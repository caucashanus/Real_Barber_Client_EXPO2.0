/**
 * Minuty do `targetMs` počítané „jako na ciferníku“: ignorujeme sekundy.
 *
 * Příklad: 12:12:59 → 12:15:00 pořád ukáže 3 (protože 12→15).
 */
export function rbLiveActivityMinutesDisplayed(nowMs: number, targetMs: number): number {
  const now = new Date(nowMs);
  now.setSeconds(0, 0);
  const target = new Date(targetMs);
  target.setSeconds(0, 0);
  const diff = target.getTime() - now.getTime();
  if (!Number.isFinite(diff) || diff <= 0) return 0;
  return Math.max(1, diff / 60_000);
}
