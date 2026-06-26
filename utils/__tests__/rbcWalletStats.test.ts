import { describe, expect, it } from 'vitest';

import type { RbCoinsHistoryItem } from '@/api/rb-coins';
import {
  aggregateRbCoinsByMonth,
  buildMonthKeys,
  buildMonthKeysForYear,
  clampWalletChartYear,
  filterRbCoinsHistoryByMonth,
  getDefaultMonthKeyForYear,
  getLatestSelectableMonthKeyForYear,
  isMonthKeySelectableInYear,
  shiftMonthKeyInYear,
  computeChartMonthsForYear,
  computeRbcWalletStats,
  monthKeyFromDate,
  RBC_WALLET_MIN_YEAR,
} from '@/utils/rbcWalletStats';

function tx(
  id: string,
  createdAt: string,
  amount: number,
  direction: 'sent' | 'received'
): RbCoinsHistoryItem {
  return {
    id,
    amount,
    type: 'TRANSFER',
    description: '',
    direction,
    otherParty: null,
    performedBy: null,
    createdAt,
    updatedAt: createdAt,
  };
}

describe('rbcWalletStats', () => {
  it('builds month keys ending at current month', () => {
    const keys = buildMonthKeys(3, new Date(2026, 5, 15));
    expect(keys).toEqual(['2026-04', '2026-05', '2026-06']);
  });

  it('aggregates received and sent per month', () => {
    const keys = ['2026-01', '2026-02'];
    const buckets = aggregateRbCoinsByMonth(
      [
        tx('1', '2026-01-12T10:00:00.000Z', 100, 'received'),
        tx('2', '2026-01-20T10:00:00.000Z', 40, 'sent'),
        tx('3', '2026-02-03T10:00:00.000Z', 250, 'received'),
      ],
      keys
    );
    expect(buckets['2026-01']).toEqual({ received: 100, sent: 40 });
    expect(buckets['2026-02']).toEqual({ received: 250, sent: 0 });
  });

  it('builds all months for a calendar year', () => {
    expect(buildMonthKeysForYear(2026)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
    ]);
  });

  it('clamps chart year between min year and current year', () => {
    const now = new Date(2028, 3, 1);
    expect(clampWalletChartYear(2024, now)).toBe(RBC_WALLET_MIN_YEAR);
    expect(clampWalletChartYear(2027, now)).toBe(2027);
    expect(clampWalletChartYear(2030, now)).toBe(2028);
  });

  it('shifts month within a calendar year', () => {
    const now = new Date(2026, 5, 15);
    expect(shiftMonthKeyInYear('2026-06', 2026, 'older', now)).toBe('2026-05');
    expect(shiftMonthKeyInYear('2026-06', 2026, 'newer', now)).toBeNull();
    expect(shiftMonthKeyInYear('2026-01', 2026, 'older', now)).toBeNull();
    expect(shiftMonthKeyInYear('2026-05', 2026, 'newer', now)).toBe('2026-06');
    expect(shiftMonthKeyInYear('2025-12', 2025, 'newer', now)).toBeNull();
  });

  it('blocks future months in the current year', () => {
    const now = new Date(2026, 5, 15);
    expect(getLatestSelectableMonthKeyForYear(2026, now)).toBe('2026-06');
    expect(isMonthKeySelectableInYear('2026-06', 2026, now)).toBe(true);
    expect(isMonthKeySelectableInYear('2026-07', 2026, now)).toBe(false);
    expect(isMonthKeySelectableInYear('2025-12', 2025, now)).toBe(true);
  });

  it('picks default month key for year', () => {
    const now = new Date(2026, 5, 15);
    expect(getDefaultMonthKeyForYear(2026, now)).toBe('2026-06');
    expect(getDefaultMonthKeyForYear(2025, now)).toBe('2025-12');
  });

  it('computes chart months for selected year only', () => {
    const chart = computeChartMonthsForYear(
      [
        tx('1', '2026-06-01T10:00:00.000Z', 500, 'received'),
        tx('2', '2025-12-01T10:00:00.000Z', 900, 'received'),
      ],
      2026,
      'en'
    );

    expect(chart).toHaveLength(12);
    expect(chart[5].monthKey).toBe('2026-06');
    expect(chart[5].received).toBe(500);
    expect(chart[0].received).toBe(0);
  });

  it('filters history by calendar month', () => {
    const filtered = filterRbCoinsHistoryByMonth(
      [
        tx('1', '2026-06-01T10:00:00.000Z', 500, 'received'),
        tx('2', '2026-05-04T10:00:00.000Z', 300, 'received'),
        tx('3', '2026-06-10T10:00:00.000Z', 120, 'sent'),
      ],
      '2026-06'
    );

    expect(filtered.map((row) => row.id)).toEqual(['3', '1']);
  });

  it('computes hero stats and recent transactions', () => {
    const now = new Date(2026, 5, 15);
    const stats = computeRbcWalletStats(
      [
        tx('1', '2026-06-01T10:00:00.000Z', 500, 'received'),
        tx('2', '2026-06-10T10:00:00.000Z', 120, 'sent'),
        tx('3', '2026-05-04T10:00:00.000Z', 300, 'received'),
      ],
      { now, locale: 'en', recentLimit: 2 }
    );

    expect(stats.heroMonths[0].monthKey).toBe(monthKeyFromDate(now));
    expect(stats.heroMonths[0].received).toBe(500);
    expect(stats.heroMonths[0].sent).toBe(120);
    expect(stats.recentTransactions).toHaveLength(2);
    expect(stats.recentTransactions[0].id).toBe('2');
  });
});
