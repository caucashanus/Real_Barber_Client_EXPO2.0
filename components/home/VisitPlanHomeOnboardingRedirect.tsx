import { useFocusEffect } from 'expo-router/react-navigation';
import { router } from 'expo-router';
import React, { useCallback, useRef } from 'react';

import { getClientVisitPlan } from '@/api/visit-plan';
import { useAuth } from '@/contexts/AuthContext';
import { visitPlanHasStoredPlan } from '@/utils/visitPlanCrmMapping';
import {
  markHomeVisitPlanPromoShown,
  shouldShowHomeVisitPlanPromo,
} from '@/utils/visitPlanHomePromoStorage';
import { VISIT_PLAN_DEV_FORCE_ONBOARDING_PREVIEW } from '@/utils/visitPlanDevFlags';
import { visitPlanShouldOfferOnboarding } from '@/utils/visitPlanOfferOnboarding';

/** Režim A — home tab `real-barber`: offer + 30d cooldown → onboarding intro. */
export default function VisitPlanHomeOnboardingRedirect() {
  const { apiToken, client, isLoading: authLoading } = useAuth();
  const inflightRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (authLoading || !apiToken || !client?.id) return;

      let cancelled = false;

      const run = async () => {
        if (inflightRef.current) return;
        inflightRef.current = true;
        try {
          if (VISIT_PLAN_DEV_FORCE_ONBOARDING_PREVIEW) {
            router.replace('/screens/visit-plan-onboarding-intro');
            return;
          }

          const plan = await getClientVisitPlan(apiToken);
          if (cancelled) return;

          const hasStoredPlan = visitPlanHasStoredPlan(plan);
          if (
            !visitPlanShouldOfferOnboarding({
              hasStoredPlan,
              lastCompletedVisitDate: plan.lastCompletedVisitDate,
            })
          ) {
            return;
          }

          const clientId = client.id;
          const showPromo = await shouldShowHomeVisitPlanPromo(clientId);
          if (cancelled || !showPromo) return;

          await markHomeVisitPlanPromoShown(clientId);
          if (cancelled) return;

          router.replace('/screens/visit-plan-onboarding-intro');
        } catch {
          // GET selhal — ne redirectovat
        } finally {
          inflightRef.current = false;
        }
      };

      void run();

      return () => {
        cancelled = true;
      };
    }, [apiToken, authLoading, client?.id])
  );

  return null;
}
