import { router } from 'expo-router';
import { useEffect } from 'react';

import { visitPlanShouldOfferOnboarding } from '@/utils/visitPlanOfferOnboarding';

/** Bez uloženého plánu + completed návštěva → intro onboardingu (parita s web, režim B). */
export function useVisitPlanRequiresOnboardingRedirect(input: {
  enabled: boolean;
  hasStoredPlan: boolean;
  lastCompletedVisitDate: string | null;
  loading: boolean;
}): boolean {
  const { enabled, hasStoredPlan, lastCompletedVisitDate, loading } = input;

  const shouldRedirect =
    enabled &&
    !loading &&
    visitPlanShouldOfferOnboarding({ hasStoredPlan, lastCompletedVisitDate });

  useEffect(() => {
    if (!shouldRedirect) return;
    router.replace('/screens/visit-plan-onboarding-intro');
  }, [shouldRedirect]);

  return shouldRedirect;
}
