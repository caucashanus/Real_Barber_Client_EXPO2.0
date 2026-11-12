import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import Header from '@/components/Header';
import SiteLoadingState from '@/components/SiteLoadingState';
import VisitPlanMainContent from '@/components/visit-plan/VisitPlanMainContent';
import VisitPlanRoot from '@/components/visit-plan/VisitPlanRoot';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitPlan } from '@/contexts/VisitPlanContext';
import { LOGIN_PATH } from '@/constants/authRoutes';
import { useVisitPlanRequiresOnboardingRedirect } from '@/hooks/useVisitPlanRequiresOnboardingRedirect';
import { useTranslation } from '@/hooks/useTranslation';

function VisitPlanPageBody() {
  const { t } = useTranslation();
  const { apiToken, isLoading: authLoading } = useAuth();
  const { loading: planLoading, hasStoredPlan, lastCompletedVisitDate } = useVisitPlan();

  const pageReady = Boolean(apiToken) && !authLoading;
  const onboardingRedirect = useVisitPlanRequiresOnboardingRedirect({
    enabled: pageReady,
    hasStoredPlan,
    lastCompletedVisitDate,
    loading: planLoading,
  });

  useEffect(() => {
    if (!pageReady) return;
    if (!apiToken) {
      router.replace(LOGIN_PATH);
    }
  }, [apiToken, pageReady]);

  if (!pageReady || planLoading || onboardingRedirect) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <SiteLoadingState layout="page" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header
        showBackButton
        title={t('visitPlanPageTitle')}
        subtitle={t('visitPlanPageSubtitle')}
      />
      <View className="min-h-0 flex-1">
        <VisitPlanMainContent />
      </View>
    </View>
  );
}

export default function VisitPlanScreen() {
  return (
    <VisitPlanRoot>
      <VisitPlanPageBody />
    </VisitPlanRoot>
  );
}
