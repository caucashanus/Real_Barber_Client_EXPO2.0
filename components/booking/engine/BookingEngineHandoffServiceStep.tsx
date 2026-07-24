import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import type { BookingEngineFlow } from '@/app/hooks/useBookingEngineFlow';
import BookingHandoffServiceTimeButton from '@/components/booking/BookingHandoffServiceTimeButton';
import ThemedText from '@/components/ThemedText';
import { BOOKING_FLOW_CARD_OUTER_CLASS } from '@/components/booking/engine/BookingPanelPickerRow';
import type { BookingSlotServiceItem } from '@/lib/booking/booking-api/types';
import type { BookingService } from '@/lib/booking/constants';
import {
  formatBookingSlotHandoffContextLine,
  formatBookingSlotHandoffServiceTimeButtonLabel,
} from '@/utils/reservationCreateHelpers';
import { shadowPresets } from '@/utils/useShadow';

function slotServiceToBookingService(service: BookingSlotServiceItem): BookingService {
  return {
    id: service.id,
    name: service.name,
    pricing: { minPrice: service.price },
    duration: service.durationMinutes,
    imageUrl: service.imageUrl,
  };
}

interface Props {
  flow: BookingEngineFlow;
}

export default function BookingEngineHandoffServiceStep({ flow }: Props) {
  const { t } = flow;
  const handoff = flow.slotHandoff;
  if (!handoff) return null;

  const contextLabel = formatBookingSlotHandoffContextLine({
    employeeName: handoff.employeeName,
    branchName: handoff.branchName,
    branchAddress: handoff.branchAddress,
    date: handoff.date,
    slotStart: handoff.slot.start,
    dateLocaleTag: flow.dateLocaleTag,
    t,
  });

  return (
    <View>
      <ThemedText className="mb-2 text-lg font-semibold">{t('reservationSlotHandoffTitle')}</ThemedText>
      <ThemedText className="text-sm">{contextLabel}</ThemedText>
      <ThemedText className="mb-5 mt-1 text-sm text-light-subtext dark:text-dark-subtext">
        {t('bookingSlotHandoffSubtitle')}
      </ThemedText>

      {flow.loadingSlotServices ? (
        <View className="items-center py-10">
          <ActivityIndicator size="small" />
          <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      ) : null}

      {flow.slotServicesError ? (
        <ThemedText className="text-sm text-red-500 dark:text-red-400">{flow.slotServicesError}</ThemedText>
      ) : null}

      {!flow.loadingSlotServices && flow.slotServices.length === 0 ? (
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('reservationNoServices')}
        </ThemedText>
      ) : null}

      {!flow.loadingSlotServices && flow.slotServices.length > 0 ? (
        <View>
          {flow.slotServices.map((service) => {
            const inSlot = service.available !== false;
            const isSelected = flow.selectedService?.id === service.id;
            const timeButtonLabel = formatBookingSlotHandoffServiceTimeButtonLabel({
              inSlot,
              handoffDate: handoff.date,
              handoffSlotStart: handoff.slot.start,
              nextAvailable: service.nextAvailable,
              dateLocaleTag: flow.dateLocaleTag,
              t,
            });

            return (
              <View
                key={service.id}
                style={shadowPresets.card}
                className={`${BOOKING_FLOW_CARD_OUTER_CLASS} p-4 ${
                  isSelected ? 'border-2 border-light-text dark:border-dark-text' : ''
                }`}>
                <View className="flex-row items-start gap-3">
                  <Image
                    source={
                      service.imageUrl
                        ? { uri: service.imageUrl }
                        : require('@/assets/img/barbers.png')
                    }
                    className="h-14 w-14 rounded-xl"
                    style={{ width: 56, height: 56, opacity: inSlot ? 1 : 0.5 }}
                    contentFit="cover"
                  />
                  <View className="min-w-0 flex-1">
                    <ThemedText
                      className={`text-base font-semibold ${inSlot ? '' : 'line-through opacity-70'}`}
                      numberOfLines={2}>
                      {service.name}
                    </ThemedText>
                    <View className="mt-3 self-start">
                      <BookingHandoffServiceTimeButton
                        title={timeButtonLabel}
                        selected={isSelected}
                        onPress={() => flow.selectService(slotServiceToBookingService(service))}
                      />
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
