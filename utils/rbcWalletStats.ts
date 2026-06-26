import type { RbCoinsHistoryItem } from '@/api/rb-coins';

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

export function monthKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
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

/** Poslední měsíc, na který lze v daném roce přepnout (u běžícího roku = aktuální měsíc). */
export function getLatestSelectableMonthKeyForYear(year: number, now: Date = new Date()): string {
  const currentYear = now.getFullYear();
  if (year < currentYear) return `${year}-12`;
  return monthKeyFromDate(now);
}

export function isMonthKeySelectableInYear(
  monthKey: string,
  year: number,
  now: Date = new Date()
): boolean {
  return monthKey <= getLatestSelectableMonthKeyForYear(year, now);
}

/** `older` = předchozí kalendářní měsíc v daném roce, `newer` = další (ne do budoucnosti). */
export function shiftMonthKeyInYear(
  monthKey: string,
  year: number,
  direction: 'older' | 'newer',
  now: Date = new Date()
): string | null {
  const months = buildMonthKeysForYear(year);
  const index = months.indexOf(monthKey);
  if (index === -1) return null;
  const nextIndex = direction === 'older' ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= months.length) return null;
  const nextKey = months[nextIndex];
  if (!nextKey || !isMonthKeySelectableInYear(nextKey, year, now)) return null;
  return nextKey;
}

export function heroMonthFromChartMonth(
  month: RbcWalletChartMonth,
  locale: string,
  now: Date = new Date()
): RbcWalletHeroMonth {
  return {
    monthKey: month.monthKey,
    isCurrentMonth: month.monthKey === monthKeyFromDate(now),
    monthName: formatMonthName(month.monthKey, locale),
    received: month.received,
    sent: month.sent,
  };
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

export function getRecentRbCoinsTransactions(
  history: RbCoinsHistoryItem[],
  limit: number = RBC_WALLET_RECENT_TX_LIMIT
): RbCoinsHistoryItem[] {
  return [...history]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function filterRbCoinsHistoryByMonth(
  history: RbCoinsHistoryItem[],
  monthKey: string
): RbCoinsHistoryItem[] {
  return history
    .filter((tx) => monthKeyFromDate(new Date(tx.createdAt)) === monthKey)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
