import { describe, expect, it } from 'vitest';

import { shouldShowHomeVisitPlanIntervalBanner } from '@/utils/visitPlanHomeIntervalBanner';

describe('shouldShowHomeVisitPlanIntervalBanner', () => {
  const base = {
    hasStoredPlan: true,
    lastCompletedVisitDate: '2025-10-01',
    nextVisitTarget: '2025-10-22',
    upcomingBookingDate: null as string | null,
  };

  it('shows when plan, completed, target, no upcoming', () => {
    expect(shouldShowHomeVisitPlanIntervalBanner(base)).toBe(true);
  });

  it('hides without stored plan', () => {
    expect(shouldShowHomeVisitPlanIntervalBanner({ ...base, hasStoredPlan: false })).toBe(false);
  });

  it('hides without completed visit', () => {
    expect(
      shouldShowHomeVisitPlanIntervalBanner({ ...base, lastCompletedVisitDate: null })
    ).toBe(false);
  });

  it('hides with upcoming booking', () => {
    expect(
      shouldShowHomeVisitPlanIntervalBanner({ ...base, upcomingBookingDate: '2025-10-25' })
    ).toBe(false);
  });
});
