import React, { useCallback, useRef } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import type { EmployeeTodaySlot, TeamMemberPageBranch } from '@/api/publicTeamMember';
import type { Locale } from '@/contexts/LanguageContext';
import AppButton from '@/components/AppButton';
import HomeTodayTeamWaitlistSheet, {
  type HomeTodayTeamWaitlistSheetHandle,
} from '@/components/home/HomeTodayTeamWaitlistSheet';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import {
  getPragueTodayDateString,
  getTeamMemberBranchName,
  getTodayAvailabilityState,
  type TodayShiftStatus,
} from '@/utils/teamMemberPageHelpers';
import {
  isTeamMemberWaitlistJoined,
  markTeamMemberWaitlistJoined,
  useTeamMemberWaitlistJoined,
} from '@/utils/teamMemberWaitlistSession';
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
  waitlistBranchId?: string;
  onScrollToAvailability?: () => void;
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

function AvailabilityScrollLink({
  onPress,
  t,
}: {
  onPress: () => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <Pressable onPress={onPress} className="mt-2 self-start">
      <ThemedText className="text-sm font-medium text-light-text dark:text-dark-text">
        {t('barberScrollToAvailability')}
      </ThemedText>
    </Pressable>
  );
}

export default function BarberTodaySlotsSection({
  employeeId,
  employeeName,
  branches,
  locale,
  todaySlots,
  loadingSlots,
  shiftStatus,
  waitlistBranchId,
  onScrollToAvailability,
  t,
}: BarberTodaySlotsSectionProps) {
  const todayIso = getPragueTodayDateString();
  const waitlistSheetRef = useRef<HomeTodayTeamWaitlistSheetHandle>(null);
  const alreadyOnWaitlist = useTeamMemberWaitlistJoined(employeeId, todayIso);

  const availabilityState = getTodayAvailabilityState(todaySlots, shiftStatus);
  const showWaitlist =
    !loadingSlots && shiftStatus === 'active' && todaySlots.length === 0;
  const showScrollLink = Boolean(onScrollToAvailability) && availabilityState !== 'slots';

  const sectionTitle =
    todaySlots.length === 1 ? t('barberNearestSlotTitle') : t('barberNearestSlotsTitle');

  const handleOpenWaitlist = useCallback(() => {
    if (isTeamMemberWaitlistJoined(employeeId, todayIso)) return;

    const branchLabel = waitlistBranchId
      ? resolveBranchForSlot(branches, waitlistBranchId, locale).branchName
      : undefined;

    waitlistSheetRef.current?.open({
      employeeId,
      employeeName,
      branchLabel: branchLabel && branchLabel !== '—' ? branchLabel : undefined,
      dayIso: todayIso,
      requireActiveNow: true,
    });
  }, [employeeId, employeeName, todayIso, waitlistBranchId, branches, locale]);

  const handleWaitlistJoined = useCallback(
    (joinedEmployeeId: string, dayIso?: string) => {
      void markTeamMemberWaitlistJoined(joinedEmployeeId, dayIso);
    },
    []
  );

  return (
    <>
      <View
        className={`${BARBER_DETAIL_SECTION_SPACING} rounded-2xl bg-light-secondary p-4 dark:bg-dark-secondary`}>
        <View className="mb-3 flex-row items-start justify-between gap-3">
          <ThemedText className="shrink text-lg font-semibold">{sectionTitle}</ThemedText>
          {showWaitlist && !alreadyOnWaitlist ? (
            <AppButton
              size="sm"
              title={t('homeTodayTeamWaitlistJoin')}
              onPress={handleOpenWaitlist}
            />
          ) : null}
        </View>

        {loadingSlots ? (
          <View className="items-center py-2">
            <ActivityIndicator size="small" />
          </View>
        ) : null}

        {!loadingSlots && availabilityState === 'slots' ? (
          <View className="flex-row flex-wrap items-start self-start">
            {todaySlots.map((slot) => {
              const { branchName, branchAddress } = resolveBranchForSlot(
                branches,
                slot.branchId,
                locale
              );
              return (
                <SlotTimePill
                  key={`${slot.date}-${slot.time}-${slot.branchId}`}
                  spaced
                  time={slot.time}
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

        {!loadingSlots && showWaitlist ? (
          <View>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {alreadyOnWaitlist
                ? t('homeTodayTeamWaitlistJoined')
                : t('homeTodayTeamWaitlistHint')}
            </ThemedText>
            {showScrollLink && onScrollToAvailability ? (
              <AvailabilityScrollLink onPress={onScrollToAvailability} t={t} />
            ) : null}
          </View>
        ) : null}

        {!loadingSlots && availabilityState === 'unavailable' ? (
          <View>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('barberUnavailableToday')}
            </ThemedText>
            {showScrollLink && onScrollToAvailability ? (
              <AvailabilityScrollLink onPress={onScrollToAvailability} t={t} />
            ) : null}
          </View>
        ) : null}

        {!loadingSlots && availabilityState === 'full' && !showWaitlist ? (
          <View>
            <ThemedText className="text-sm font-medium text-light-text dark:text-dark-text">
              {t('barberFullyBookedToday')}
            </ThemedText>
            {showScrollLink && onScrollToAvailability ? (
              <AvailabilityScrollLink onPress={onScrollToAvailability} t={t} />
            ) : null}
          </View>
        ) : null}
      </View>

      <HomeTodayTeamWaitlistSheet
        ref={waitlistSheetRef}
        onJoined={handleWaitlistJoined}
        t={t}
      />
    </>
  );
}
