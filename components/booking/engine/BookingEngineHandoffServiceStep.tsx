import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import type { BookingEngineFlow } from '@/app/hooks/useBookingEngineFlow';
import { Chip } from '@/components/Chip';
import ThemedText from '@/components/ThemedText';
import { BOOKING_FLOW_CARD_OUTER_CLASS } from '@/components/booking/engine/BookingPanelPickerRow';
import type { BookingSlotServiceItem } from '@/lib/booking/booking-api/types';
import type { BookingService } from '@/lib/booking/constants';
import { shadowPresets } from '@/utils/useShadow';

function formatSlotServiceTimeLabel(
  service: BookingSlotServiceItem,
  handoffSlotStart: string,
  dateLocaleTag: string
): string {
  if (service.available !== false) return handoffSlotStart;
  const next = service.nextAvailable;
  if (!next) return handoffSlotStart;
  try {
    const d = new Date(`${next.date}T12:00:00`);
    const day = d.toLocaleDateString(dateLocaleTag, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    return `${day} ${next.slotStart}`;
  } catch {
    return `${next.date} ${next.slotStart}`;
  }
}

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

  const contextLabel = `${handoff.employeeName ?? ''} · ${handoff.branchName ?? handoff.branchId} · ${handoff.date} ${handoff.slot.start}`;

  return (
    <View>
      <ThemedText className="mb-2 text-lg font-semibold">{t('reservationSlotHandoffTitle')}</ThemedText>
      <ThemedText className="mb-5 text-sm text-light-subtext dark:text-dark-subtext">
        {contextLabel}
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
            const timeLabel = formatSlotServiceTimeLabel(
              service,
              handoff.slot.start,
              flow.dateLocaleTag
            );

            return (
              <View
                key={service.id}
                style={
                  isSelected
                    ? [shadowPresets.card, { borderColor: flow.branchHighlightColor, borderWidth: 2 }]
                    : shadowPresets.card
                }
                className={`${BOOKING_FLOW_CARD_OUTER_CLASS} p-4`}>
                <View className="flex-row items-center gap-3">
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
                    {typeof service.price === 'number' ? (
                      <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
                        {t('reservationPriceFromPrefix')} {service.price} {t('reservationCurrencySuffix')}
                      </ThemedText>
                    ) : null}
                    {!inSlot && service.nextAvailable ? (
                      <ThemedText className="mt-1 text-xs text-light-subtext dark:text-dark-subtext">
                        {timeLabel}
                      </ThemedText>
                    ) : null}
                  </View>
                  <Chip
                    size="lg"
                    label={inSlot ? timeLabel : t('bookingServiceSelect')}
                    isSelected={isSelected}
                    onPress={() => flow.selectService(slotServiceToBookingService(service))}
                    style={
                      isSelected
                        ? {
                            backgroundColor: flow.branchHighlightColor,
                            borderColor: flow.branchHighlightColor,
                          }
                        : undefined
                    }
                  />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
