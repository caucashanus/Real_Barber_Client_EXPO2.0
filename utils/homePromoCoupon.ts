import type { ClientCoupon } from '@/api/client-coupons';

/** Pořadí poboček pro řazení a rotaci („Poznejte …“) — znaky v názvu kupónu (lowercase includes). */
const HOME_PROMO_BRANCH_SLOTS: readonly string[][] = [
  ['modřany', 'modrany'],
  ['kačerov', 'kacerov'],
  ['hagibor'],
  ['barrandov'],
];

function homePromoBranchSlot(name: string): number {
  const lower = name.toLowerCase();
  for (let s = 0; s < HOME_PROMO_BRANCH_SLOTS.length; s++) {
    if (HOME_PROMO_BRANCH_SLOTS[s].some((k) => lower.includes(k))) return s;
  }
  return HOME_PROMO_BRANCH_SLOTS.length;
}

export function compareHomePromoCoupons(a: ClientCoupon, b: ClientCoupon): number {
  const slotA = homePromoBranchSlot(a.name);
  const slotB = homePromoBranchSlot(b.name);
  if (slotA !== slotB) return slotA - slotB;
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

/** Seed pro rozložení rotace napříč uživateli (před „prázdným“ řetězcem použij fallback na apiToken). */
export function homePromoClientSeed(clientIdOrEmpty: string): number {
  let h = 0;
  for (let i = 0; i < clientIdOrEmpty.length; i++) {
    h = (h * 31 + clientIdOrEmpty.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function localYYYYMMDD(nowMs: number): number {
  const d = new Date(nowMs);
  return d.getFullYear() * 10_000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/**
 * Jedna nabídka kupónu na home za den: řazení poboček + (lokální den + seed) % počet.
 * Vždy z aktuálního seznamu z API → jiný den jiný slot, dokud nabídky zbývají.
 */
export function pickDailyFeaturedHomePromoCoupon(
  coupons: ClientCoupon[],
  opts: { nowMs: number; clientSeed: number }
): ClientCoupon | null {
  if (coupons.length === 0) return null;
  const sorted = [...coupons].sort(compareHomePromoCoupons);
  const n = sorted.length;
  const dayKey = localYYYYMMDD(opts.nowMs);
  const idx = (dayKey + opts.clientSeed) % n;
  return sorted[idx] ?? sorted[0] ?? null;
}
