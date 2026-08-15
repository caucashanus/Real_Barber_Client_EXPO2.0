import React from 'react';
import { View } from 'react-native';

import { BookingEngineProvider } from '@/contexts/BookingEngineContext';
import { useBookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import BookingEngineFlowShell from '@/components/booking/engine/BookingEngineFlowShell';
import BookingEngineStepContent from '@/components/booking/engine/BookingEngineStepContent';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';

function ReservationCreateContent() {
  const flow = useBookingEngineFlow();

  if (flow.bootstrapStatus === 'pending') {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header showBackButton />
      </View>
    );
  }

  if (flow.bootstrapStatus === 'error') {
    return (
      <View className="flex-1 bg-light-primary px-global pt-2 dark:bg-dark-primary">
        <Header showBackButton />
        <View className="mt-6">
          <ThemedText className="text-base text-light-text dark:text-dark-text">
            {flow.error ?? flow.t('reservationFromDeepLinkError')}
          </ThemedText>
        </View>
      </View>
    );
  }

  if (flow.submitSuccess) {
    return (
      <View className="flex-1 bg-light-primary px-global pt-2 dark:bg-dark-primary">
        <Header showBackButton />
        <View className="mt-6">
          <ThemedText className="text-base text-light-text dark:text-dark-text">
            {flow.t('reservationSummaryCreating')}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <BookingEngineFlowShell flow={flow}>
      <BookingEngineStepContent flow={flow} stepKind={flow.step} />
    </BookingEngineFlowShell>
  );
}

export default function ReservationCreateScreen() {
  return (
    <BookingEngineProvider>
      <ReservationCreateContent />
    </BookingEngineProvider>
  );
}
