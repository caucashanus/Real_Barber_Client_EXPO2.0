import { describe, expect, it } from 'vitest';

import { visitPlanShouldOfferOnboarding } from '@/utils/visitPlanOfferOnboarding';

describe('visitPlanShouldOfferOnboarding', () => {
  it('offers when no plan and completed visit date present', () => {
    expect(
      visitPlanShouldOfferOnboarding({
        hasStoredPlan: false,
        lastCompletedVisitDate: '2026-01-15',
      })
    ).toBe(true);
  });

  it('does not offer when plan exists', () => {
    expect(
      visitPlanShouldOfferOnboarding({
        hasStoredPlan: true,
        lastCompletedVisitDate: '2026-01-15',
      })
    ).toBe(false);
  });

  it('does not offer without completed visit', () => {
    expect(
      visitPlanShouldOfferOnboarding({
        hasStoredPlan: false,
        lastCompletedVisitDate: null,
      })
    ).toBe(false);
    expect(
      visitPlanShouldOfferOnboarding({
        hasStoredPlan: false,
        lastCompletedVisitDate: '   ',
      })
    ).toBe(false);
  });
});
