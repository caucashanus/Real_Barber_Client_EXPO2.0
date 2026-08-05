import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import CustomCard from '@/components/CustomCard';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';
import type { TranslationKey } from '@/locales';
import type { NearestBranchHomeSlot } from '@/utils/nearestBranchHomeSlots';
import { formatNextSlotDisplayTime } from '@/utils/reservationCreateHelpers';
import { startBarberSlotHandoffBooking } from '@/utils/reservationSlotHandoff';

interface BranchHomeSlotsSectionProps {
  slotGroups: { dayLabel: string; slots: NearestBranchHomeSlot[] }[];
  loading?: boolean;
  t: (key: TranslationKey) => string;
}

const cardClassName = `${BARBER_DETAIL_SECTION_SPACING} bg-light-secondary dark:bg-dark-secondary`;

export default function BranchHomeSlotsSection({
  slotGroups,
  loading = false,
  t,
}: BranchHomeSlotsSectionProps) {
  if (loading) {
    return (
      <CustomCard
        rounded="2xl"
        padding="md"
        border
        background={false}
        className={cardClassName}>
        <View className="items-start py-2">
          <ActivityIndicator size="small" />
        </View>
      </CustomCard>
    );
  }

  if (slotGroups.length === 0) return null;

  return (
    <CustomCard
      rounded="2xl"
      padding="md"
      border
      background={false}
      className={cardClassName}>
      <ThemedText className="mb-3 text-lg font-semibold">{t('nearestBranchSlotsTitle')}</ThemedText>

      <View className="gap-2">
        {slotGroups.map((group) => (
          <View key={group.slots[0]?.date ?? group.dayLabel}>
            <ThemedText className="mb-2 text-sm font-medium text-light-subtext dark:text-dark-subtext">
              {group.dayLabel}
            </ThemedText>
            <View className="flex-row flex-wrap items-start">
              {group.slots.map((slot) => (
                <SlotTimePill
                  key={`${slot.date}-${slot.time}-${slot.employeeId}`}
                  compact
                  spaced
                  title={`${formatNextSlotDisplayTime(slot.time)} · ${slot.employeeName}`}
                  onPress={() => {
                    void startBarberSlotHandoffBooking({
                      employeeId: slot.employeeId,
                      employeeName: slot.employeeName,
                      branchId: slot.branchId,
                      branchName: slot.branchName,
                      branchAddress: slot.branchAddress,
                      date: slot.date,
                      slotStart: slot.time,
                      slotEnd: slot.endTime || undefined,
                    }).catch(() => {});
                  }}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </CustomCard>
  );
}
