import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';

import type { TeamMemberPageBranch } from '@/api/publicTeamMember';
import type { Locale } from '@/contexts/LanguageContext';
import AppButton from '@/components/AppButton';
import CustomCard from '@/components/CustomCard';
import HomeTodayTeamWaitlistSheet, {
  type HomeTodayTeamWaitlistSheetHandle,
} from '@/components/home/HomeTodayTeamWaitlistSheet';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import type { BarberNearestSlotDayGroup } from '@/utils/teamMemberPageHelpers';
import {
  getPragueTodayDateString,
  getTeamMemberBranchName,
} from '@/utils/teamMemberPageHelpers';
import {
  isTeamMemberWaitlistJoined,
  markTeamMemberWaitlistJoined,
  useTeamMemberWaitlistJoined,
} from '@/utils/teamMemberWaitlistSession';
import { startBarberSlotHandoffBooking } from '@/utils/reservationSlotHandoff';
import type { TranslationKey } from '@/locales';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';

const DAY_ROW_SPACING_STYLE = { marginBottom: 16 } as const;

interface BarberTodaySlotsSectionProps {
  employeeId: string;
  employeeName: string;
  branches?: TeamMemberPageBranch[];
  locale: Locale;
  dayGroups: BarberNearestSlotDayGroup[];
  today: string;
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

function BarberNearestSlotDayRow({
  dayGroup,
  employeeId,
  employeeName,
  branches,
  locale,
  today,
  t,
  onOpenWaitlist,
  isLast,
}: {
  dayGroup: BarberNearestSlotDayGroup;
  employeeId: string;
  employeeName: string;
  branches?: TeamMemberPageBranch[];
  locale: Locale;
  today: string;
  t: (key: TranslationKey) => string;
  onOpenWaitlist: (dayGroup: BarberNearestSlotDayGroup) => void;
  isLast: boolean;
}) {
  const alreadyOnWaitlist = useTeamMemberWaitlistJoined(employeeId, dayGroup.date);
  const fullyBookedLabel =
    dayGroup.date === today ? t('barberFullyBookedToday') : t('barberFullyBookedThatDay');

  return (
    <View className="w-full" style={isLast ? undefined : DAY_ROW_SPACING_STYLE}>
      <ThemedText className="mb-2 text-sm font-medium text-light-subtext dark:text-dark-subtext">
        {dayGroup.dayLabel}
      </ThemedText>

      {dayGroup.kind === 'slots' ? (
        <View className="w-full flex-row flex-wrap items-start">
          {dayGroup.slots.map((slot) => {
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

      {dayGroup.kind === 'full' ? (
        <ThemedText className="text-sm font-medium text-light-text dark:text-dark-text">
          {fullyBookedLabel}
        </ThemedText>
      ) : null}

      {dayGroup.kind === 'waitlist' ? (
        <View className="w-full">
          <ThemedText className="text-sm font-medium text-light-text dark:text-dark-text">
            {fullyBookedLabel}
          </ThemedText>
          <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
            {alreadyOnWaitlist
              ? t('homeTodayTeamWaitlistJoined')
              : t('homeTodayTeamWaitlistHint')}
          </ThemedText>
          {!alreadyOnWaitlist ? (
            <AppButton
              size="sm"
              title={t('homeTodayTeamWaitlistJoin')}
              onPress={() => onOpenWaitlist(dayGroup)}
              className="mt-2 self-start"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function BarberTodaySlotsSection({
  employeeId,
  employeeName,
  branches,
  locale,
  dayGroups,
  today,
  t,
}: BarberTodaySlotsSectionProps) {
  const waitlistSheetRef = useRef<HomeTodayTeamWaitlistSheetHandle>(null);
  const todayIso = today || getPragueTodayDateString();

  const handleOpenWaitlist = useCallback(
    (dayGroup: BarberNearestSlotDayGroup) => {
      if (isTeamMemberWaitlistJoined(employeeId, dayGroup.date)) return;

      const branchLabel = dayGroup.waitlistBranchId
        ? resolveBranchForSlot(branches, dayGroup.waitlistBranchId, locale).branchName
        : undefined;

      waitlistSheetRef.current?.open({
        employeeId,
        employeeName,
        branchLabel: branchLabel && branchLabel !== '—' ? branchLabel : undefined,
        dayIso: dayGroup.date,
        requireActiveNow: dayGroup.requireActiveNow,
      });
    },
    [employeeId, employeeName, branches, locale]
  );

  const handleWaitlistJoined = useCallback(
    (joinedEmployeeId: string, dayIso?: string) => {
      void markTeamMemberWaitlistJoined(joinedEmployeeId, dayIso);
    },
    []
  );

  if (dayGroups.length === 0) return null;

  return (
    <>
      <CustomCard
        rounded="2xl"
        padding="md"
        border
        background={false}
        className={`${BARBER_DETAIL_SECTION_SPACING} bg-light-secondary dark:bg-dark-secondary`}>
        <ThemedText className="mb-3 text-lg font-semibold">{t('barberNearestSlotsTitle')}</ThemedText>

        {dayGroups.map((dayGroup, index) => (
          <BarberNearestSlotDayRow
            key={dayGroup.date}
            dayGroup={dayGroup}
            employeeId={employeeId}
            employeeName={employeeName}
            branches={branches}
            locale={locale}
            today={todayIso}
            t={t}
            onOpenWaitlist={handleOpenWaitlist}
            isLast={index === dayGroups.length - 1}
          />
        ))}
      </CustomCard>

      <HomeTodayTeamWaitlistSheet
        ref={waitlistSheetRef}
        onJoined={handleWaitlistJoined}
        t={t}
      />
    </>
  );
}
