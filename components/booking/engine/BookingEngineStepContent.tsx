import React from 'react';
import { View } from 'react-native';

import type { BookingEngineFlow } from '@/app/hooks/useBookingEngineFlow';
import ThemedText from '@/components/ThemedText';
import BookingEngineBranchStep from '@/components/booking/engine/BookingEngineBranchStep';
import BookingEngineContactStep from '@/components/booking/engine/BookingEngineContactStep';
import BookingEngineDatetimeStep from '@/components/booking/engine/BookingEngineDatetimeStep';
import BookingEngineEmployeeStep from '@/components/booking/engine/BookingEngineEmployeeStep';
import BookingEngineHandoffServiceStep from '@/components/booking/engine/BookingEngineHandoffServiceStep';
import BookingEngineServiceStep from '@/components/booking/engine/BookingEngineServiceStep';

interface Props {
  flow: BookingEngineFlow;
  stepKind: BookingEngineFlow['activeSteps'][number];
}

export default function BookingEngineStepContent({ flow, stepKind }: Props) {
  const { t } = flow;

  if (stepKind === 'branch') {
    return <BookingEngineBranchStep flow={flow} />;
  }

  if (stepKind === 'service') {
    if (flow.isSlotHandoffFlow) {
      return <BookingEngineHandoffServiceStep flow={flow} />;
    }

    const isEmployeeProfile = flow.recipeId === 'employee-profile';

    return (
      <View>
        {flow.services.length === 0 && !flow.loading ? (
          <ThemedText className="mb-3 text-sm text-light-subtext dark:text-dark-subtext">
            {t('reservationNoServices')}
          </ThemedText>
        ) : null}
        <BookingEngineServiceStep
          services={flow.services}
          loading={flow.loading}
          showServiceInfo={isEmployeeProfile}
          selectedServiceId={flow.selectedService?.id}
          selectLabel={t('bookingServiceSelect')}
          fromPriceLabel={t('reservationPriceFromPrefix')}
          currencySuffix={t('reservationCurrencySuffix')}
          closeLabel={t('sheetClose')}
          onSelect={flow.selectService}
        />
      </View>
    );
  }

  if (stepKind === 'employee') {
    return <BookingEngineEmployeeStep flow={flow} />;
  }

  if (stepKind === 'datetime') {
    return <BookingEngineDatetimeStep flow={flow} />;
  }

  return <BookingEngineContactStep flow={flow} />;
}
