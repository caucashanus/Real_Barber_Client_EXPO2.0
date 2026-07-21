import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import type { EmployeeTodaySlot, TeamMemberPageBranch } from '@/api/publicTeamMember';
import type { Locale } from '@/app/contexts/LanguageContext';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import {
  getTeamMemberBranchName,
  getTodayAvailabilityState,
  type TodayShiftStatus,
} from '@/utils/teamMemberPageHelpers';
import { startBarberSlotHandoffBooking } from '@/utils/reservationSlotHandoff';
import type { TranslationKey } from '@/locales';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';

interface BarberTodaySlotsSectionProps {
  employeeId: string;
  employeeName: string;
  branches?: TeamMemberPageBranch[];
  locale: Locale;
  todaySlots: EmployeeTodaySlot[];
  loadingSlots: boolean;
  shiftStatus: TodayShiftStatus;
  t: (key: TranslationKey) => string;
}

function resolveBranchForSlot(
  branches: TeamMemberPageBranch[] | undefined,
  branchId: string,
  locale: Locale
) {
  const list = branches ?? [];
  const branch = list.find((row) => row.id === branchId);
  return {
    branchName: branch ? getTeamMemberBranchName(branch, locale) : '—',
    branchAddress: branch?.address ?? null,
  };
}

export default function BarberTodaySlotsSection({
  employeeId,
  employeeName,
  branches,
  locale,
  todaySlots,
  loadingSlots,
  shiftStatus,
  t,
}: BarberTodaySlotsSectionProps) {
  const availabilityState = getTodayAvailabilityState(todaySlots, shiftStatus);

  return (
    <View className={`${BARBER_DETAIL_SECTION_SPACING} rounded-2xl bg-light-secondary p-4 dark:bg-dark-secondary`}>
      <ThemedText className="mb-3 text-lg font-semibold">
        {todaySlots.length === 1
          ? t('barberNearestSlotTitle')
          : t('barberNearestSlotsTitle')}
      </ThemedText>

      {loadingSlots ? (
        <View className="items-center py-2">
          <ActivityIndicator size="small" />
        </View>
      ) : null}

      {!loadingSlots && availabilityState === 'slots' ? (
        <View className="flex-row flex-wrap items-start gap-2 self-start">
          {todaySlots.map((slot) => {
            const { branchName, branchAddress } = resolveBranchForSlot(
              branches,
              slot.branchId,
              locale
            );
            return (
              <SlotTimePill
                key={`${slot.date}-${slot.time}-${slot.branchId}`}
                label={slot.time}
                surface="light-card"
                onPress={() => {
                  startBarberSlotHandoffBooking({
                    employeeId,
                    employeeName,
                    branchId: slot.branchId,
                    branchName,
                    branchAddress,
                    date: slot.date,
                    slotStart: slot.time,
                    slotEnd: slot.endTime,
                  }).catch(() => {});
                }}
              />
            );
          })}
        </View>
      ) : null}

      {!loadingSlots && availabilityState === 'unavailable' ? (
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('barberUnavailableToday')}
        </ThemedText>
      ) : null}

      {!loadingSlots && availabilityState === 'full' ? (
        <ThemedText className="text-sm font-medium text-light-text dark:text-dark-text">
          {t('barberFullyBookedToday')}
        </ThemedText>
      ) : null}
    </View>
  );
}
