import type { RbCoinsHistoryItem } from '@/api/rb-coins';

export const RBC_WALLET_HERO_MONTHS = 6;
export const RBC_WALLET_RECENT_TX_LIMIT = 5;
/** RBC peněženka v appce — data od tohoto roku. */
export const RBC_WALLET_MIN_YEAR = 2026;

export interface RbcWalletHeroMonth {
  monthKey: string;
  isCurrentMonth: boolean;
  monthName: string;
  received: number;
  sent: number;
}

export interface RbcWalletChartMonth {
  monthKey: string;
  shortLabel: string;
  received: number;
  sent: number;
}

export interface RbcWalletStatsResult {
  heroMonths: RbcWalletHeroMonth[];
  recentTransactions: RbCoinsHistoryItem[];
}

export function monthKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function buildMonthKeys(count: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKeyFromDate(d));
  }
  return keys;
}

export function buildMonthKeysForYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const m = String(monthIndex + 1).padStart(2, '0');
    return `${year}-${m}`;
  });
}

export function clampWalletChartYear(year: number, now: Date = new Date()): number {
  const currentYear = now.getFullYear();
  return Math.min(Math.max(year, RBC_WALLET_MIN_YEAR), currentYear);
}

export function getWalletChartYearBounds(now: Date = new Date()): {
  minYear: number;
  maxYear: number;
} {
  return { minYear: RBC_WALLET_MIN_YEAR, maxYear: now.getFullYear() };
}

function emptyBuckets(keys: string[]): Record<string, { received: number; sent: number }> {
  const buckets: Record<string, { received: number; sent: number }> = {};
  for (const key of keys) {
    buckets[key] = { received: 0, sent: 0 };
  }
  return buckets;
}

export function aggregateRbCoinsByMonth(
  history: RbCoinsHistoryItem[],
  keys: string[]
): Record<string, { received: number; sent: number }> {
  const buckets = emptyBuckets(keys);
  const allowed = new Set(keys);

  for (const tx of history) {
    const key = monthKeyFromDate(new Date(tx.createdAt));
    if (!allowed.has(key)) continue;
    const amount = Number(tx.amount) || 0;
    if (amount === 0) continue;
    if (tx.direction === 'received') {
      buckets[key].received += amount;
    } else if (tx.direction === 'sent') {
      buckets[key].sent += amount;
    }
  }

  return buckets;
}

export function formatMonthName(monthKey: string, locale: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return new Date(Number.isFinite(y) ? y : 0, Number.isFinite(m) ? m - 1 : 0, 1).toLocaleDateString(
    tag,
    { month: 'long' }
  );
}

export function formatMonthShortLabel(monthKey: string, locale: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return new Date(Number.isFinite(y) ? y : 0, Number.isFinite(m) ? m - 1 : 0, 1).toLocaleDateString(
    tag,
    { month: 'short' }
  );
}

export function computeChartMonthsForYear(
  history: RbCoinsHistoryItem[],
  year: number,
  locale: string
): RbcWalletChartMonth[] {
  const safeYear = clampWalletChartYear(year);
  const keys = buildMonthKeysForYear(safeYear);
  const buckets = aggregateRbCoinsByMonth(history, keys);

  return keys.map((monthKey) => ({
    monthKey,
    shortLabel: formatMonthShortLabel(monthKey, locale),
    received: buckets[monthKey].received,
    sent: buckets[monthKey].sent,
  }));
}

export function computeRbcWalletStats(
  history: RbCoinsHistoryItem[],
  options?: {
    now?: Date;
    locale?: string;
    recentLimit?: number;
  }
): RbcWalletStatsResult {
  const now = options?.now ?? new Date();
  const locale = options?.locale ?? 'en';
  const recentLimit = options?.recentLimit ?? RBC_WALLET_RECENT_TX_LIMIT;
  const currentMonthKey = monthKeyFromDate(now);

  const heroKeys = buildMonthKeys(RBC_WALLET_HERO_MONTHS, now);
  const heroBuckets = aggregateRbCoinsByMonth(history, heroKeys);
  const heroMonths: RbcWalletHeroMonth[] = [...heroKeys].reverse().map((monthKey) => ({
    monthKey,
    isCurrentMonth: monthKey === currentMonthKey,
    monthName: formatMonthName(monthKey, locale),
    received: heroBuckets[monthKey].received,
    sent: heroBuckets[monthKey].sent,
  }));

  const recentTransactions = [...history]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, recentLimit);

  return { heroMonths, recentTransactions };
}

export function filterRbCoinsHistoryByMonth(
  history: RbCoinsHistoryItem[],
  monthKey: string
): RbCoinsHistoryItem[] {
  return history
    .filter((tx) => monthKeyFromDate(new Date(tx.createdAt)) === monthKey)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
