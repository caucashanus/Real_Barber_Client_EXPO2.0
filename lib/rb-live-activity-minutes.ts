/**
 * Minuty do `targetMs`, počítané od začátku aktuální místní minuty (sekundy a ms = 0).
 * Tak 19:27:xx → start 19:30 ukáže 3 min (rozdíl „27 vs 30“ na ciferníku), ne 2 kvůli uběhlým sekundám.
 */
export function rbLiveActivityMinutesDisplayed(nowMs: number, targetMs: number): number {
  const anchor = new Date(nowMs);
  anchor.setSeconds(0, 0);
  const diff = targetMs - anchor.getTime();
  if (!Number.isFinite(diff) || diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / 60_000));
}
