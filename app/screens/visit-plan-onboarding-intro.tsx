import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import VisitPlanOnboardingIntroFlow from '@/components/visit-plan/onboarding/VisitPlanOnboardingIntroFlow';
import VisitPlanGate from '@/components/visit-plan/VisitPlanGate';
import VisitPlanRoot from '@/components/visit-plan/VisitPlanRoot';
import { useTranslation } from '@/hooks/useTranslation';

function IntroBody() {
  return (
    <View style={styles.fill}>
      <VisitPlanOnboardingIntroFlow />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

export default function VisitPlanOnboardingIntroScreen() {
  const { t } = useTranslation();

  return (
    <VisitPlanRoot>
      <VisitPlanGate redirectIfHasPlan loadingFallback={<ActivityIndicator accessibilityLabel={t('visitPlanLoading')} />}>
        <IntroBody />
      </VisitPlanGate>
    </VisitPlanRoot>
  );
}
