import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import type { BookingSlotServiceItem } from '@/api/bookings';
import type { ReservationCreateStepProps } from './types';

import BookingHandoffServiceTimeButton from '@/components/booking/BookingHandoffServiceTimeButton';
import { CardScroller } from '@/components/CardScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { formatBookingSlotHandoffServiceTimeButtonLabel } from '@/utils/reservationCreateHelpers';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';

export default function ReservationServiceStep({ flow }: ReservationCreateStepProps) {
  const { t } = flow;

  if (flow.isSlotHandoffFlow && flow.slotHandoff) {
    const handoff = flow.slotHandoff;
    const contextLabel = flow.slotHandoffContextLabel;

    return (
      <ScrollView className="px-6 pb-4 pt-2">
        <View className="mb-5">
          <ThemedText className="text-2xl font-semibold">
            {t('reservationSlotHandoffTitle')}
          </ThemedText>
          <ThemedText className="mt-2 text-sm">{contextLabel}</ThemedText>
          <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
            {t('bookingSlotHandoffSubtitle')}
          </ThemedText>
        </View>

        {flow.loadingSlotServices ? (
          <View className="items-center py-10">
            <SiteLoadingSpinner size="compact" />
            <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">
              {t('commonLoading')}
            </ThemedText>
          </View>
        ) : null}

        {!flow.loadingSlotServices && flow.slotServicesError ? (
          <ThemedText className="text-sm text-red-500 dark:text-red-400">
            {flow.slotServicesError}
          </ThemedText>
        ) : null}

        {!flow.loadingSlotServices && !flow.slotServicesError && flow.slotServices.length === 0 ? (
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {t('reservationNoServices')}
          </ThemedText>
        ) : null}

        {!flow.loadingSlotServices && flow.slotServices.length > 0 ? (
          <View className="gap-3">
            {flow.slotServices.map((service) => {
              const inSlot = flow.isServiceAvailableInHandoffSlot(service);
              const isSelected = flow.selectedSlotServiceId === service.id;
              const timeButtonLabel = formatBookingSlotHandoffServiceTimeButtonLabel({
                inSlot,
                handoffDate: handoff.date,
                handoffSlotStart: handoff.slotStart,
                nextAvailable: service.nextAvailable,
                dateLocaleTag: flow.dateLocaleTag,
                t});

              return (
                <Pressable
                  key={service.id}
                  onPress={() => flow.selectSlotService(service)}
                  className="rounded-2xl border p-3 active:opacity-80 border-light-secondary bg-light-surface dark:border-dark-secondary dark:bg-dark-secondary"
                  style={
                    isSelected
                      ? { borderColor: flow.colors.highlight, borderWidth: 2 }
                      : undefined
                  }>
                  <View className="flex-row items-start gap-3">
                    <Image
                      source={
                        service.imageUrl
                          ? { uri: service.imageUrl }
                          : require('@/assets/img/barbers.png')
                      }
                      className="h-16 w-16 rounded-xl"
                      contentFit="cover"
                      style={{ opacity: inSlot ? 1 : 0.5 }}
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
                          onPress={() => flow.selectSlotService(service)}
                        />
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    );
  }

  const categories = useMemo(
    () => flow.branchStepServiceCategories,
    [flow.branchStepServiceCategories]
  );

  return (
    <ScrollView className="px-6 pb-4 pt-2">
      <View className="mb-3 items-center">
        <Image
          source={require('@/assets/img/reservation-service.png')}
          className="h-16 w-16"
          style={{ width: 64, height: 64 }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <View className="mb-5">
        <ThemedText className="text-2xl font-semibold">
          {t('reservationStepServiceTitle')}
        </ThemedText>
        <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
          {t('reservationStepServiceSubtitle')}
        </ThemedText>
      </View>
      {(flow.loadingBranchServicesFetch ||
        (flow.loadingAggregatedBranchServices && flow.branchStepServiceOptions.length === 0)) &&
      flow.branchStepServiceOptions.length === 0 ? (
        <View className="items-center py-10">
          <SiteLoadingSpinner size="compact" />
          <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      ) : null}
      {!flow.loadingBranchServicesFetch && categories.length > 0
        ? categories.map((category, categoryIndex) => (
            <Section
              key={`res-svc-cat-${category.key}-${categoryIndex}`}
              title={category.name}
              titleSize="lg"
              className="mb-4">
              <CardScroller className="mt-1.5 pb-1" space={12}>
                {category.services.map((service, serviceIndex) => {
                  const isSelected = flow.data.itemId === service.id;
                  return (
                    <Pressable
                      key={`res-svc-${category.key}-${service.id}-${serviceIndex}`}
                      onPress={() => flow.selectServiceOption(service)}
                      className="w-[160px] active:opacity-80">
                      <View
                        className="relative overflow-hidden rounded-2xl"
                        style={
                          isSelected
                            ? { borderColor: flow.colors.highlight, borderWidth: 2 }
                            : undefined
                        }>
                        <Image
                          source={
                            service.imageUrl
                              ? { uri: service.imageUrl }
                              : require('@/assets/img/barbers.png')
                          }
                          className="h-[140px] w-[160px]"
                          contentFit="cover"
                        />
                        <View className="absolute right-2 top-2 z-10 rounded-full bg-light-secondary px-2 py-1 dark:bg-dark-secondary">
                          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                            {t('reservationPriceFromPrefix')} {service.price}{' '}
                            {t('reservationCurrencySuffix')}
                          </ThemedText>
                        </View>
                      </View>
                      <View className="w-full py-2">
                        <ThemedText className="min-w-0 text-sm font-medium" numberOfLines={2}>
                          {service.name}
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </CardScroller>
            </Section>
          ))
        : null}
      {!flow.loadingBranchServicesFetch &&
      !flow.loadingAggregatedBranchServices &&
      flow.branchStepServiceOptions.length === 0 ? (
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('reservationNoServices')}
        </ThemedText>
      ) : null}
    </ScrollView>
  );
}
