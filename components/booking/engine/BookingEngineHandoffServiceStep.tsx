import { Image } from 'expo-image';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import BookingHandoffServiceTimeButton from '@/components/booking/BookingHandoffServiceTimeButton';
import ThemedText from '@/components/ThemedText';
import { BOOKING_FLOW_CARD_OUTER_CLASS } from '@/components/booking/engine/BookingPanelPickerRow';
import { mapSlotServiceItemToBookingService } from '@/lib/booking/booking-api/mappers';
import {
  formatBookingSlotHandoffContextLine,
  formatBookingSlotHandoffServiceTimeButtonLabel,
  formatNextSlotDisplayTime,
} from '@/utils/reservationCreateHelpers';
import { formatBookingServicePriceLabel } from '@/lib/booking/designShared';
import { shadowPresets } from '@/utils/useShadow';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';

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

  const slotGoneBannerLabel = t('bookingSlotHandoffSlotGoneBanner').replace(
    '{time}',
    formatNextSlotDisplayTime(handoff.slot.start)
  );

  return (
    <View>
      <ThemedText className="mb-2 text-lg font-semibold">{t('reservationSlotHandoffTitle')}</ThemedText>
      <ThemedText className="text-sm">{contextLabel}</ThemedText>
      <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
        {t('bookingSlotHandoffSubtitle')}
      </ThemedText>

      {flow.loadingSlotServices ? (
        <View className="items-center py-10">
          <SiteLoadingSpinner size="compact" />
          <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      ) : null}

      {flow.slotServicesError ? (
        <ThemedText className="mt-5 text-sm text-red-500 dark:text-red-400">{flow.slotServicesError}</ThemedText>
      ) : null}

      {!flow.loadingSlotServices && flow.slotServices.length === 0 ? (
        <ThemedText className="mt-5 text-sm text-light-subtext dark:text-dark-subtext">
          {t('reservationNoServices')}
        </ThemedText>
      ) : null}

      {!flow.loadingSlotServices && flow.slotServices.length > 0 ? (
        <View className="mt-5">
          {flow.showSlotHandoffSlotGoneBanner ? (
            <View className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
              <ThemedText className="text-sm text-amber-700 dark:text-amber-300">
                {slotGoneBannerLabel}
              </ThemedText>
            </View>
          ) : null}

          {flow.slotServices.map((service) => {
            const inSlot = service.available === true;
            const isSelected = flow.selectedService?.id === service.id;
            const timeButtonLabel = formatBookingSlotHandoffServiceTimeButtonLabel({
              inSlot,
              handoffDate: handoff.date,
              handoffSlotStart: handoff.slot.start,
              nextAvailable: service.nextAvailable,
              dateLocaleTag: flow.dateLocaleTag,
              t,
            });

            const priceLabel =
              service.price > 0
                ? formatBookingServicePriceLabel(
                    mapSlotServiceItemToBookingService(service),
                    t('reservationPriceFromPrefix'),
                    t('reservationCurrencySuffix')
                  )
                : undefined;

            return (
              <Pressable
                key={service.id}
                onPress={() => flow.selectSlotHandoffServiceItem(service)}
                accessibilityRole="button"
                style={shadowPresets.card}
                className={`${BOOKING_FLOW_CARD_OUTER_CLASS} p-4 active:opacity-90 ${
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
                    {priceLabel ? (
                      <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
                        {priceLabel}
                      </ThemedText>
                    ) : null}
                    <View className="mt-3 self-start">
                      <BookingHandoffServiceTimeButton
                        title={timeButtonLabel}
                        selected={isSelected}
                        onPress={() => flow.selectSlotHandoffServiceItem(service)}
                      />
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
