import { router } from 'expo-router';
import { useEffect } from 'react';

/** Bez uloženého plánu v CRM → intro onboardingu (parita s web). */
export function useVisitPlanRequiresOnboardingRedirect(input: {
  enabled: boolean;
  hasStoredPlan: boolean;
  loading: boolean;
}): boolean {
  const { enabled, hasStoredPlan, loading } = input;

  const shouldRedirect = enabled && !loading && !hasStoredPlan;

  useEffect(() => {
    if (!shouldRedirect) return;
    router.replace('/screens/visit-plan-onboarding-intro');
  }, [shouldRedirect]);

  return shouldRedirect;
}
