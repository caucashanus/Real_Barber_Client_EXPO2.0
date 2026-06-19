import { Image } from 'expo-image';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import type { ReservationCreateStepProps } from './types';

import Avatar from '@/components/Avatar';
import ShowRating from '@/components/ShowRating';
import ThemedText from '@/components/ThemedText';
import Selectable from '@/components/forms/Selectable';
import {
  employeeDescription,
  formatEmployeeNearestSlotLabel,
  getEmployeeAverageRating,
} from '@/utils/reservationCreateHelpers';

export default function ReservationEmployeeStep({ flow }: ReservationCreateStepProps) {
  const { t } = flow;

  return (
    <ScrollView className="px-6 pb-4 pt-2">
      <View className="mb-3 items-center">
        <Image
          source={require('@/assets/img/reservation-specialist.png')}
          className="h-16 w-16"
          style={{ width: 64, height: 64 }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <View className="mb-5">
        <ThemedText variant="h2">
          {t('reservationStepEmployeeTitle')}
        </ThemedText>
        <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
          {t('reservationStepEmployeeSubtitle')}
        </ThemedText>
      </View>
      {flow.employeesDisplayOrder.map((emp) => {
        const empRating = getEmployeeAverageRating(emp);
        const itemIdReady = flow.data.itemId.trim() !== '';
        const nearestEntry = itemIdReady ? flow.employeesNearestMap?.get(emp.id) : undefined;
        const empServicePrice =
          itemIdReady &&
          nearestEntry != null &&
          typeof nearestEntry.price === 'number' &&
          nearestEntry.price > 0
            ? nearestEntry.price
            : null;
        const hasMore = Boolean(employeeDescription(emp));

        const showNearestLoading =
          itemIdReady && flow.loadingEmployeesNearest && flow.employeesNearestMap === null;
        const showNearestLoaded =
          itemIdReady && flow.employeesNearestMap != null && flow.employeesNearestMap.has(emp.id);
        let nearestPillText: string | null = null;
        if (showNearestLoading) {
          nearestPillText = t('reservationEmployeeNearestLoading');
        } else if (showNearestLoaded && nearestEntry) {
          nearestPillText = nearestEntry.nextSlot
            ? formatEmployeeNearestSlotLabel(nearestEntry.nextSlot, flow.dateLocaleTag, t)
            : t('reservationEmployeeNoNearestSlot');
        }

        const hasNearestPill = nearestPillText != null;
        const rowBadges = empServicePrice != null || hasMore;

        return (
          <View key={emp.id} className="mb-3 mt-1">
            <View className="relative">
              {rowBadges ? (
                <View
                  className="absolute right-3 z-10 flex-row flex-wrap items-center justify-end gap-1"
                  style={{ top: -3 }}>
                  {empServicePrice != null ? (
                    <View className="rounded-full bg-light-secondary px-1.5 py-0.5 dark:bg-dark-secondary">
                      <ThemedText
                        className="text-[11px] leading-snug text-light-subtext dark:text-dark-subtext"
                        numberOfLines={1}>
                        {empServicePrice} {t('reservationCurrencySuffix')}
                      </ThemedText>
                    </View>
                  ) : null}
                  {hasMore ? (
                    <Pressable
                      className="rounded-full border border-neutral-300 bg-transparent px-1.5 py-0.5 active:opacity-70 dark:border-neutral-500"
                      onPress={() => flow.openEmployeeDetails(emp.id)}>
                      <ThemedText className="text-[11px] leading-snug text-light-subtext dark:text-dark-subtext">
                        {t('reservationMore')}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              <Selectable
                title={emp.name}
                descriptionContent={
                  hasNearestPill ? (
                    <View className="flex-row flex-wrap items-center gap-2">
                      <ThemedText className="shrink-0 text-sm leading-snug text-light-subtext dark:text-dark-subtext">
                        {t('reservationEmployeeNearestFreeSlotLabel')}
                      </ThemedText>
                      <View
                        className="min-w-0 max-w-full shrink rounded-full bg-light-secondary px-2 py-1 dark:bg-dark-secondary"
                        style={{ borderWidth: 1, borderColor: flow.colors.highlight }}>
                        <ThemedText variant="body"
                          className="text-[11px]"
                          numberOfLines={2}>
                          {nearestPillText}
                        </ThemedText>
                      </View>
                    </View>
                  ) : undefined
                }
                customIcon={
                  <View
                    className="h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-light-secondary dark:bg-dark-secondary"
                    style={
                      flow.data.employeeId === emp.id
                        ? { borderColor: flow.colors.highlight, borderWidth: 2 }
                        : undefined
                    }>
                    <Avatar size="sm" src={emp.avatarUrl ?? undefined} name={emp.name} />
                  </View>
                }
                customIconUnstyled
                containerClassName="mb-0"
                className="relative overflow-visible"
                selected={flow.data.employeeId === emp.id}
                showSelectedIndicator={false}
                onPress={() => flow.selectEmployee(emp.id)}
              />
            </View>
            {empRating != null ? (
              <View className="ml-16 mt-1 flex-row items-center gap-2">
                <ShowRating rating={empRating} size="sm" displayMode="stars" />
                <View className="rounded-full bg-light-secondary px-2 py-1 dark:bg-dark-secondary">
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                    {empRating.toFixed(1)}
                  </ThemedText>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
      {flow.employees.length === 0 ? (
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('reservationNoBarbers')}
        </ThemedText>
      ) : null}
    </ScrollView>
  );
}
