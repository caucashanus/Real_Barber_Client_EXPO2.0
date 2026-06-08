import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useReservationCreateFlow } from '@/app/hooks/useReservationCreateFlow';
import Header from '@/components/Header';
import MultiStep, { Step } from '@/components/MultiStep';
import ThemedText from '@/components/ThemedText';
import ReservationBranchStep from '@/components/booking/reservation-create/ReservationBranchStep';
import ReservationDatetimeStep from '@/components/booking/reservation-create/ReservationDatetimeStep';
import ReservationDetailSheets from '@/components/booking/reservation-create/ReservationDetailSheets';
import ReservationEmployeeStep from '@/components/booking/reservation-create/ReservationEmployeeStep';
import ReservationServiceStep from '@/components/booking/reservation-create/ReservationServiceStep';
import ReservationSummaryStep from '@/components/booking/reservation-create/ReservationSummaryStep';

export default function ReservationCreateScreen() {
  const flow = useReservationCreateFlow();

  if (flow.barberBootstrap === 'pending') {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" />
          <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">
            {flow.t('commonLoading')}
          </ThemedText>
        </View>
      </View>
    );
  }

  if (flow.barberBootstrap === 'error' && flow.presetEmployeeId) {
    return (
      <View className="flex-1 bg-light-primary px-global pt-2 dark:bg-dark-primary">
        <Header showBackButton />
        <View className="mt-6">
          <ThemedText className="text-base text-light-text dark:text-dark-text">
            {flow.presetEmployeeId
              ? flow.t('reservationFromBarberLoadError')
              : flow.t('reservationFromDeepLinkError')}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <>
      <MultiStep
        key={flow.multiStepKey}
        initialStepIndex={flow.initialMultiStepIndex}
        getNextStepIndex={flow.useFlowNextResolver ? flow.flowStepNextIndex : undefined}
        getPrevStepIndex={flow.useFlowPrevResolver ? flow.flowStepPrevIndex : undefined}
        onComplete={flow.handleCreateBooking}
        onClose={() => router.back()}
        showStepIndicator={false}
        onStepIndexChange={flow.onStepIndexChange}
        isNextDisabled={flow.isNextDisabled}>
        <Step title={flow.t('reservationStepBranchTitle')}>
          <ReservationBranchStep flow={flow} />
        </Step>
        <Step title={flow.t('reservationStepServiceTitle')}>
          <ReservationServiceStep flow={flow} />
        </Step>
        <Step title={flow.t('reservationStepEmployeeTitle')}>
          <ReservationEmployeeStep flow={flow} />
        </Step>
        <Step title={flow.t('reservationStepDatetimeTitle')}>
          <ReservationDatetimeStep flow={flow} />
        </Step>
        <Step title={flow.t('reservationSummaryTitle')}>
          <ReservationSummaryStep flow={flow} />
        </Step>
      </MultiStep>
      <ReservationDetailSheets flow={flow} />
    </>
  );
}
