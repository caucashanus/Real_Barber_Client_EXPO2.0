/** Minimální tvar slotu z GET /api/client/bookings/availability. */
export type AvailabilitySlotLike = {
  start: string;
  end: string;
  duration?: number;
  branchId?: string;
};

/**
 * Odstraní duplicitní sloty se stejným začátkem, koncem a branchId.
 * Zachová první výskyt a pořadí z API.
 */
export function dedupeAvailabilitySlots<T extends AvailabilitySlotLike>(slots: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const s of slots) {
    const key = `${String(s.start).trim()}|${String(s.end).trim()}|${String(s.branchId ?? '').trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}
