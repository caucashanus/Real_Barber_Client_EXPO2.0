import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { ActionSheetRef } from 'react-native-actions-sheet';

import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import VisitPlanCalendarPageContent from '@/components/visit-plan/VisitPlanCalendarPageContent';
import VisitPlanGate from '@/components/visit-plan/VisitPlanGate';
import VisitPlanPastReservationActionSheet from '@/components/visit-plan/VisitPlanPastReservationActionSheet';
import VisitPlanRoot from '@/components/visit-plan/VisitPlanRoot';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitPlan } from '@/contexts/VisitPlanContext';
import { useVisitPlanRequiresOnboardingRedirect } from '@/hooks/useVisitPlanRequiresOnboardingRedirect';
import { useTranslation } from '@/hooks/useTranslation';
import { pickRecentHomeBookings } from '@/utils/pickRecentHomeBookings';
import type { VisitPlanPastBooking } from '@/utils/visitPlanPastBookingTypes';

function CalendarBody() {
  const { t } = useTranslation();
  const { apiToken, isLoading: authLoading } = useAuth();
  const { loading: planLoading, hasStoredPlan, lastCompletedVisitDate, homeBookings } =
    useVisitPlan();
  const pastSheetRef = useRef<ActionSheetRef>(null);
  const [pastSheetBooking, setPastSheetBooking] = useState<VisitPlanPastBooking | null>(null);

  const pageReady = Boolean(apiToken) && !authLoading;
  const onboardingRedirect = useVisitPlanRequiresOnboardingRedirect({
    enabled: pageReady,
    hasStoredPlan,
    lastCompletedVisitDate,
    loading: planLoading,
  });

  const pastTemplateBooking = useMemo(
    () => pickRecentHomeBookings(homeBookings, 1)[0] ?? null,
    [homeBookings]
  );

  useEffect(() => {
    if (!pastSheetBooking) return;
    pastSheetRef.current?.show();
  }, [pastSheetBooking?.id]);

  const closePastSheet = () => {
    pastSheetRef.current?.hide();
    setPastSheetBooking(null);
  };

  if (!pageReady || planLoading || onboardingRedirect) {
    return (
      <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
        <ActivityIndicator accessibilityLabel={t('visitPlanLoading')} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton title={t('visitPlanCalendarHeading')} />
      <View className="min-h-0 flex-1">
        <ThemedScroller
          footerSpacer={false}
          contentContainerStyle={{ paddingBottom: 48, alignItems: 'stretch' }}>
          <VisitPlanCalendarPageContent
            onPastBookingPress={(booking) => setPastSheetBooking(booking)}
          />
        </ThemedScroller>
      </View>

      <VisitPlanPastReservationActionSheet
        booking={pastSheetBooking}
        templateBooking={pastTemplateBooking}
        sheetRef={pastSheetRef}
        onClose={closePastSheet}
      />
    </View>
  );
}

export default function VisitPlanCalendarScreen() {
  return (
    <VisitPlanRoot>
      <VisitPlanGate>
        <CalendarBody />
      </VisitPlanGate>
    </VisitPlanRoot>
  );
}
