import { describe, expect, it } from 'vitest';

import { resolveVisitPlanPageBannerImageVariant } from '@/utils/visitPlanPageBannerImage';
import { resolveVisitPlanPageBannerTiming } from '@/utils/visitPlanDates';

const today = '2026-03-10';

describe('resolveVisitPlanPageBannerTiming', () => {
  it('maps calendar diff to timing states', () => {
    expect(resolveVisitPlanPageBannerTiming(today, '2026-03-08')).toEqual({
      kind: 'overdue',
    });
    expect(resolveVisitPlanPageBannerTiming(today, today)).toEqual({
      kind: 'dueToday',
    });
    expect(resolveVisitPlanPageBannerTiming(today, '2026-03-11')).toEqual({
      kind: 'tomorrow',
    });
    expect(resolveVisitPlanPageBannerTiming(today, '2026-03-15')).toEqual({
      kind: 'inDays',
      days: 5,
    });
    expect(resolveVisitPlanPageBannerTiming(today, '2026-03-14')).toEqual({
      kind: 'inDays',
      days: 4,
    });
  });
});

describe('resolveVisitPlanPageBannerImageVariant', () => {
  it('uses default image for first visit', () => {
    expect(
      resolveVisitPlanPageBannerImageVariant({
        firstVisit: true,
        todayIso: today,
        nextVisitTarget: '2026-04-01',
      })
    ).toBe('default');
  });

  it('uses urgent when diff < 5 (overdue through 4 days)', () => {
    expect(
      resolveVisitPlanPageBannerImageVariant({
        firstVisit: false,
        todayIso: today,
        nextVisitTarget: '2026-03-08',
      })
    ).toBe('urgent');
    expect(
      resolveVisitPlanPageBannerImageVariant({
        firstVisit: false,
        todayIso: today,
        nextVisitTarget: '2026-03-14',
      })
    ).toBe('urgent');
  });

  it('uses relaxed for diff 5–15', () => {
    expect(
      resolveVisitPlanPageBannerImageVariant({
        firstVisit: false,
        todayIso: today,
        nextVisitTarget: '2026-03-15',
      })
    ).toBe('relaxed');
    expect(
      resolveVisitPlanPageBannerImageVariant({
        firstVisit: false,
        todayIso: today,
        nextVisitTarget: '2026-03-25',
      })
    ).toBe('relaxed');
  });

  it('uses default for diff >= 16', () => {
    expect(
      resolveVisitPlanPageBannerImageVariant({
        firstVisit: false,
        todayIso: today,
        nextVisitTarget: '2026-03-26',
      })
    ).toBe('default');
  });
});
