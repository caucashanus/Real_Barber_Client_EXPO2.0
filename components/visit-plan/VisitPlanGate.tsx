import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useVisitPlan } from '@/contexts/VisitPlanContext';
import { LOGIN_PATH } from '@/constants/authRoutes';
import { VISIT_PLAN_DEV_FORCE_ONBOARDING_PREVIEW } from '@/utils/visitPlanDevFlags';

type Props = {
  children: React.ReactNode;
  redirectIfHasPlan?: boolean;
  loadingFallback?: React.ReactNode;
};

/** Auth + CRM plán — přesměrování na hlavní plán / login. */
export default function VisitPlanGate({
  children,
  redirectIfHasPlan = false,
  loadingFallback,
}: Props) {
  const { apiToken, isLoading: authLoading } = useAuth();
  const { hasStoredPlan, loading: planLoading } = useVisitPlan();

  useEffect(() => {
    if (authLoading || planLoading) return;
    if (!apiToken) {
      router.replace(LOGIN_PATH);
      return;
    }
    if (
      redirectIfHasPlan &&
      hasStoredPlan &&
      !VISIT_PLAN_DEV_FORCE_ONBOARDING_PREVIEW
    ) {
      router.replace('/screens/visit-plan');
    }
  }, [apiToken, authLoading, hasStoredPlan, planLoading, redirectIfHasPlan]);

  if (authLoading || planLoading) {
    return (
      loadingFallback ?? (
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator />
        </View>
      )
    );
  }

  if (!apiToken) return null;
  if (redirectIfHasPlan && hasStoredPlan && !VISIT_PLAN_DEV_FORCE_ONBOARDING_PREVIEW) {
    return null;
  }

  return <>{children}</>;
}
