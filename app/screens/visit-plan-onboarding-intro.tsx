import React from 'react';
import { View, StyleSheet } from 'react-native';

import VisitPlanOnboardingIntroFlow from '@/components/visit-plan/onboarding/VisitPlanOnboardingIntroFlow';
import VisitPlanGate from '@/components/visit-plan/VisitPlanGate';
import VisitPlanRoot from '@/components/visit-plan/VisitPlanRoot';

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
  return (
    <VisitPlanRoot>
      <VisitPlanGate redirectIfHasPlan>
        <IntroBody />
      </VisitPlanGate>
    </VisitPlanRoot>
  );
}
