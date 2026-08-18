import React from 'react';
import { View } from 'react-native';

import CustomCard from '@/components/CustomCard';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';
import type { Locale } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/locales';
import {
  groupNearestBranchHomeSlotsByBranch,
  groupNearestBranchSlots,
  type NearestBranchHomeSlot} from '@/utils/nearestBranchHomeSlots';
import { formatNextSlotDisplayTime } from '@/utils/reservationCreateHelpers';
import { startBarberSlotHandoffBooking } from '@/utils/reservationSlotHandoff';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';

interface BranchHomeSlotsSectionProps {
  slotGroups: { dayLabel: string; slots: NearestBranchHomeSlot[] }[];
  loading?: boolean;
  t: (key: TranslationKey) => string;
  locale?: Locale;
  todayIso?: string;
  groupByBranch?: boolean;
  onSlotPress?: (slot: NearestBranchHomeSlot) => void;
}

const cardClassName = `${BARBER_DETAIL_SECTION_SPACING} bg-light-secondary dark:bg-dark-secondary`;

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export default function BranchHomeSlotsSection({
  slotGroups,
  loading = false,
  t,
  locale = 'cs',
  todayIso,
  groupByBranch = false,
  onSlotPress}: BranchHomeSlotsSectionProps) {
  if (loading) {
    return (
      <CustomCard
        rounded="2xl"
        padding="md"
        border
        background={false}
        className={cardClassName}>
        <View className="items-start py-2">
          <SiteLoadingSpinner size="compact" />
        </View>
      </CustomCard>
    );
  }

  if (slotGroups.length === 0) return null;

  const flatSlots = slotGroups.flatMap((group) => group.slots);
  const referenceToday = todayIso ?? flatSlots[0]?.date ?? new Date().toISOString().slice(0, 10);
  const branchGroups = groupByBranch ? groupNearestBranchHomeSlotsByBranch(flatSlots) : [];

  const handleSlotPress = (slot: NearestBranchHomeSlot) => {
    if (onSlotPress) {
      onSlotPress(slot);
      return;
    }
    void startBarberSlotHandoffBooking({
      employeeId: slot.employeeId,
      employeeName: slot.employeeName,
      branchId: slot.branchId,
      branchName: slot.branchName,
      branchAddress: slot.branchAddress,
      date: slot.date,
      slotStart: slot.time,
      slotEnd: slot.endTime || undefined}).catch(() => {});
  };

  const renderDayGroups = (slots: NearestBranchHomeSlot[]) =>
    groupNearestBranchSlots(slots, locale, referenceToday).map((group) => (
      <View key={`${group.slots[0]?.date ?? group.dayLabel}-${group.slots[0]?.branchId ?? ''}`}>
        <ThemedText className="mb-2 text-sm font-medium text-light-subtext dark:text-dark-subtext">
          {group.dayLabel}
        </ThemedText>
        <View className="flex-row flex-wrap items-start">
          {group.slots.map((slot) => (
            <SlotTimePill
              key={`${slot.branchId}-${slot.date}-${slot.time}-${slot.employeeId}`}
              compact
              spaced
              title={`${formatNextSlotDisplayTime(slot.time)} · ${firstName(slot.employeeName)}`}
              onPress={() => handleSlotPress(slot)}
            />
          ))}
        </View>
      </View>
    ));

  return (
    <CustomCard
      rounded="2xl"
      padding="md"
      border
      background={false}
      className={cardClassName}>
      <ThemedText className="mb-3 text-lg font-semibold">{t('nearestBranchSlotsTitle')}</ThemedText>

      {groupByBranch ? (
        <View className="gap-4">
          {branchGroups.map((branch) => (
            <View key={branch.branchId}>
              <ThemedText className="mb-2 text-sm font-semibold">{branch.branchName}</ThemedText>
              <View className="gap-2">{renderDayGroups(branch.slots)}</View>
            </View>
          ))}
        </View>
      ) : (
        <View className="gap-2">{renderDayGroups(flatSlots)}</View>
      )}
    </CustomCard>
  );
}
