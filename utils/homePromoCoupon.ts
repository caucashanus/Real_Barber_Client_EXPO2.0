import type { ClientCoupon } from '@/api/client-coupons';

/** Kupóny řady „Poznejte …“ v názvu — jen u nich platí denní rotace na home. */
export function isPoznejteHomePromoCoupon(coupon: ClientCoupon): boolean {
  return coupon.name.toLowerCase().includes('poznejte');
}

export function splitHomePromoCoupons(coupons: ClientCoupon[]): {
  poznejte: ClientCoupon[];
  other: ClientCoupon[];
} {
  const poznejte: ClientCoupon[] = [];
  const other: ClientCoupon[] = [];
  for (const c of coupons) {
    if (isPoznejteHomePromoCoupon(c)) poznejte.push(c);
    else other.push(c);
  }
  return { poznejte, other };
}

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

/** Interní — hoisted; jen skupina „Poznejte“. */
function pickDailyFeaturedPoznejteList(
  poznejteCoupons: ClientCoupon[],
  opts: { nowMs: number; clientSeed: number }
): ClientCoupon | null {
  if (poznejteCoupons.length === 0) return null;
  const sorted = [...poznejteCoupons].sort(compareHomePromoCoupons);
  const n = sorted.length;
  const dayKey = localYYYYMMDD(opts.nowMs);
  const idx = (dayKey + opts.clientSeed) % n;
  return sorted[idx] ?? sorted[0] ?? null;
}

/**
 * Jedna nabídka ze skupiny „Poznejte“ na home za den: řazení poboček + (den + seed) % počet.
 */
export function pickDailyFeaturedHomePromoCoupon(
  coupons: ClientCoupon[],
  opts: { nowMs: number; clientSeed: number }
): ClientCoupon | null {
  return pickDailyFeaturedPoznejteList(coupons, opts);
}

/**
 * Seznam kupónů pro karusel Tipy a nabídky: všechny ne-Poznejte + jeden denní Poznejte.
 */
export function buildHomePromoCouponCarouselList(
  coupons: ClientCoupon[],
  opts: { nowMs: number; clientSeed: number }
): ClientCoupon[] {
  const { poznejte, other } = splitHomePromoCoupons(coupons);
  const featuredPoznejte = pickDailyFeaturedPoznejteList(poznejte, opts);
  const sortedOther = [...other].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
  return featuredPoznejte ? [...sortedOther, featuredPoznejte] : sortedOther;
}
