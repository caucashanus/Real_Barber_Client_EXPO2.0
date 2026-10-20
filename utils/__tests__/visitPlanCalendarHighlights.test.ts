import { describe, expect, it } from 'vitest';

import {
  buildVisitPlanDayHighlights,
  visitPlanNextRecommendedCenterAfterUpcoming,
} from '@/utils/visitPlanCalendarHighlights';

describe('visitPlanNextRecommendedCenterAfterUpcoming', () => {
  it('adds interval days to upcoming date', () => {
    expect(visitPlanNextRecommendedCenterAfterUpcoming('2025-10-10', 21)).toBe('2025-10-31');
  });
});

describe('buildVisitPlanDayHighlights', () => {
  it('marks upcoming and 3-day window after interval (QA: 10.10 + 21d)', () => {
    const map = buildVisitPlanDayHighlights({
      idealVisitCenterIso: '2025-10-01',
      confirmedBookingDate: '2025-10-10',
      intervalDays: 21,
    });

    expect(map['2025-10-10']).toBe('confirmedBooking');
    expect(map['2025-10-30']).toBe('idealVisit');
    expect(map['2025-10-31']).toBe('idealVisit');
    expect(map['2025-11-01']).toBe('idealVisit');
  });

  it('does not paint ideal on upcoming day when it falls in window', () => {
    const map = buildVisitPlanDayHighlights({
      idealVisitCenterIso: '2025-10-01',
      confirmedBookingDate: '2025-10-31',
      intervalDays: 0,
    });
    expect(map['2025-10-31']).toBe('confirmedBooking');
    expect(map['2025-10-30']).toBe('idealVisit');
    expect(map['2025-11-01']).toBe('idealVisit');
  });

  it('without upcoming uses ideal center from CRM', () => {
    const map = buildVisitPlanDayHighlights({
      idealVisitCenterIso: '2025-11-15',
      confirmedBookingDate: null,
      intervalDays: 21,
    });
    expect(map['2025-11-14']).toBe('idealVisit');
    expect(map['2025-11-15']).toBe('idealVisit');
    expect(map['2025-11-16']).toBe('idealVisit');
    expect(Object.keys(map)).toHaveLength(3);
  });
});
