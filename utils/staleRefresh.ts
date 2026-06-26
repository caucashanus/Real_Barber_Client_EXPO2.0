export const FOCUS_STALE_MS = 60_000;

export function shouldStaleRefresh(
  lastFetchedAt: number,
  options?: { force?: boolean; staleMs?: number }
): boolean {
  if (options?.force) return true;
  if (lastFetchedAt === 0) return true;
  return Date.now() - lastFetchedAt >= (options?.staleMs ?? FOCUS_STALE_MS);
}
