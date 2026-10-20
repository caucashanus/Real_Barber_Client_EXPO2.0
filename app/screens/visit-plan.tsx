import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import Header from '@/components/Header';
import VisitPlanIntroSheet from '@/components/visit-plan/VisitPlanIntroSheet';
import VisitPlanMainContent from '@/components/visit-plan/VisitPlanMainContent';
import VisitPlanRoot from '@/components/visit-plan/VisitPlanRoot';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitPlan } from '@/contexts/VisitPlanContext';
import { LOGIN_PATH } from '@/constants/authRoutes';
import { useVisitPlanRequiresOnboardingRedirect } from '@/hooks/useVisitPlanRequiresOnboardingRedirect';
import { useTranslation } from '@/hooks/useTranslation';
import { readVisitPlanIntroSheetSeen } from '@/utils/visitPlanIntroStorage';

function VisitPlanPageBody() {
  const { t } = useTranslation();
  const { apiToken, isLoading: authLoading } = useAuth();
  const { loading: planLoading, hasStoredPlan } = useVisitPlan();
  const [introOpen, setIntroOpen] = useState(false);
  const [introReady, setIntroReady] = useState(false);

  const pageReady = Boolean(apiToken) && !authLoading;
  const onboardingRedirect = useVisitPlanRequiresOnboardingRedirect({
    enabled: pageReady,
    hasStoredPlan,
    loading: planLoading,
  });

  useEffect(() => {
    if (!pageReady) return;
    if (!apiToken) {
      router.replace(LOGIN_PATH);
    }
  }, [apiToken, pageReady]);

  useEffect(() => {
    if (!hasStoredPlan || planLoading) return;
    let cancelled = false;
    readVisitPlanIntroSheetSeen().then((seen) => {
      if (cancelled) return;
      setIntroOpen(!seen);
      setIntroReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [hasStoredPlan, planLoading]);

  if (!pageReady || planLoading || onboardingRedirect) {
    return (
      <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
        <ActivityIndicator accessibilityLabel={t('visitPlanLoading')} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      {introReady ? (
        <VisitPlanIntroSheet open={introOpen} onOpenChange={setIntroOpen} />
      ) : null}
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
