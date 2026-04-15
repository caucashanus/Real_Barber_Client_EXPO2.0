/**
 * Minuty do `targetMs` počítané z reálného času (včetně sekund),
 * zaokrouhlené nahoru (ceil).
 *
 * Příklad: 12:14:59 → 12:15:00 ukáže 1 (ne "<1" ani 2).
 */
export function rbLiveActivityMinutesDisplayed(nowMs: number, targetMs: number): number {
  const diff = targetMs - nowMs;
  if (!Number.isFinite(diff) || diff <= 0) return 0;
  // UX: nikdy neukazujeme "<1". V poslední minutě ukážeme 1, jinak zaokrouhlujeme nahoru.
  return Math.max(1, Math.ceil(diff / 60_000));
}
