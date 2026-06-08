import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import type { ReservationCreateStepProps } from './types';

import { Chip } from '@/components/Chip';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { getMonthOffsetFromToday, toIsoDate } from '@/utils/reservationCreateHelpers';

export default function ReservationDatetimeStep({ flow }: ReservationCreateStepProps) {
  const { t } = flow;

  return (
    <ScrollView className="px-6 pb-4 pt-2">
      <View className="mb-3 items-center">
        <Image
          source={require('@/assets/img/reservation-time.png')}
          className="h-16 w-16"
          style={{ width: 64, height: 64 }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <View className="mb-5">
        <ThemedText className="text-2xl font-semibold">
          {t('reservationStepDatetimeTitle')}
        </ThemedText>
        <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
          {t('reservationStepDatetimeSubtitle')}
        </ThemedText>
      </View>
      <View className="mb-4 flex-row gap-2">
        {flow.showTodayChip ? (
          <Chip
            size="lg"
            label={t('reservationToday')}
            isSelected={flow.data.date === flow.todayIso}
            onPress={() => {
              const target = new Date();
              flow.setMonthOffset(Math.max(0, getMonthOffsetFromToday(target)));
              flow.selectDate(toIsoDate(target));
            }}
          />
        ) : null}
        {flow.showTomorrowChip ? (
          <Chip
            size="lg"
            label={t('reservationTomorrow')}
            isSelected={flow.data.date === flow.tomorrowIso}
            onPress={() => {
              const target = new Date(Date.now() + 24 * 60 * 60 * 1000);
              flow.setMonthOffset(Math.max(0, getMonthOffsetFromToday(target)));
              flow.selectDate(toIsoDate(target));
            }}
          />
        ) : null}
      </View>
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          disabled={flow.monthOffset === 0}
          onPress={() => flow.setMonthOffset((prev) => Math.max(0, prev - 1))}
          className={`rounded-full p-2 ${flow.monthOffset === 0 ? 'opacity-40' : 'opacity-100'}`}>
          <Icon name="ChevronLeft" size={24} className="-translate-x-px" />
        </Pressable>
        <ThemedText className="text-base font-semibold">{flow.monthLabel}</ThemedText>
        <Pressable
          onPress={() => flow.setMonthOffset((prev) => prev + 1)}
          className="rounded-full p-2">
          <Icon name="ChevronRight" size={24} className="translate-x-px" />
        </Pressable>
      </View>
      {flow.loadingMonthAvailability ? (
        <View className="items-center py-4">
          <ActivityIndicator size="small" />
        </View>
      ) : null}
      <View className="flex-row flex-wrap gap-2">
        {flow.visibleMonthDays.map((day) => (
          <Chip
            key={day.value}
            size="lg"
            label={day.label}
            isSelected={flow.data.date === day.value}
            onPress={() => flow.selectDate(day.value)}
          />
        ))}
      </View>
      {!flow.loadingMonthAvailability && flow.visibleMonthDays.length === 0 ? (
        <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
          {t('reservationNoSlotsMonth')}
        </ThemedText>
      ) : null}
      <View className="mb-2 mt-6">
        <ThemedText className="text-lg font-semibold">{t('reservationAvailableTimes')}</ThemedText>
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('reservationAvailableTimesSubtitle')}
        </ThemedText>
      </View>
      {flow.loadingAvailability ? (
        <View className="items-center py-10">
          <ActivityIndicator size="small" />
        </View>
      ) : flow.availabilityError ? (
        <ThemedText className="text-red-500">{flow.availabilityError}</ThemedText>
      ) : (
        <>
          {flow.groupedSlots.morning.length > 0 ? (
            <Section title={t('reservationMorning')} titleSize="md" className="mb-2">
              <View className="mt-1 flex-row flex-wrap gap-2">
                {flow.groupedSlots.morning.map((slot, index) => (
                  <Chip
                    key={`m-${slot.start}-${slot.end}-${slot.branchId ?? 'any'}-${index}`}
                    size="lg"
                    label={slot.start}
                    isSelected={
                      flow.data.slotStart === slot.start && flow.data.slotEnd === slot.end
                    }
                    onPress={() => flow.selectAvailabilitySlot(slot)}
                  />
                ))}
              </View>
            </Section>
          ) : null}
          {flow.groupedSlots.afternoon.length > 0 ? (
            <Section title={t('reservationAfternoon')} titleSize="md" className="mb-2">
              <View className="mt-1 flex-row flex-wrap gap-2">
                {flow.groupedSlots.afternoon.map((slot, index) => (
                  <Chip
                    key={`a-${slot.start}-${slot.end}-${slot.branchId ?? 'any'}-${index}`}
                    size="lg"
                    label={slot.start}
                    isSelected={
                      flow.data.slotStart === slot.start && flow.data.slotEnd === slot.end
                    }
                    onPress={() => flow.selectAvailabilitySlot(slot)}
                  />
                ))}
              </View>
            </Section>
          ) : null}
          {flow.groupedSlots.evening.length > 0 ? (
            <Section title={t('reservationEvening')} titleSize="md" className="mb-2">
              <View className="mt-1 flex-row flex-wrap gap-2">
                {flow.groupedSlots.evening.map((slot, index) => (
                  <Chip
                    key={`e-${slot.start}-${slot.end}-${slot.branchId ?? 'any'}-${index}`}
                    size="lg"
                    label={slot.start}
                    isSelected={
                      flow.data.slotStart === slot.start && flow.data.slotEnd === slot.end
                    }
                    onPress={() => flow.selectAvailabilitySlot(slot)}
                  />
                ))}
              </View>
            </Section>
          ) : null}
          {(flow.availability?.availability?.slots?.length ?? 0) === 0 ? (
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('reservationNoSlotsSelection')}
            </ThemedText>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
