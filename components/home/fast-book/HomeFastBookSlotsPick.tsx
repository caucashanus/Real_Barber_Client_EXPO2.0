import React, { useMemo } from 'react';
import { View } from 'react-native';

import HomeFastBookRowInset from '@/components/home/fast-book/HomeFastBookRowInset';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import { HOME_FAST_BOOK_AFTER_SERVICES_CLASS } from '@/components/home/fast-book/homeFastBookSheetUi';
import type { Locale } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/locales';
import { nearestBranchHomeSlotSelectionKey } from '@/utils/homeFastBookBookingNav';
import {
  groupNearestBranchHomeSlotsByBranch,
  groupNearestBranchSlots,
  type NearestBranchHomeSlot,
} from '@/utils/nearestBranchHomeSlots';
import { formatNextSlotDisplayTime } from '@/utils/reservationCreateHelpers';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

type Props = {
  slots: NearestBranchHomeSlot[];
  selectedSlotKey: string | null;
  onSelectSlot: (slot: NearestBranchHomeSlot) => void;
  locale: Locale;
  t: (key: TranslationKey) => string;
};

export default function HomeFastBookSlotsPick({
  slots,
  selectedSlotKey,
  onSelectSlot,
  locale,
  t,
}: Props) {
  const todayIso = useMemo(() => getPragueTodayDateString(), []);
  const branchGroups = useMemo(() => groupNearestBranchHomeSlotsByBranch(slots), [slots]);

  if (slots.length === 0) {
    return (
      <HomeFastBookRowInset className={HOME_FAST_BOOK_AFTER_SERVICES_CLASS}>
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('fastBookNearestSlotsEmpty')}
        </ThemedText>
      </HomeFastBookRowInset>
    );
  }

  return (
    <View className={`w-full gap-4 ${HOME_FAST_BOOK_AFTER_SERVICES_CLASS}`}>
      <HomeFastBookRowInset>
        <ThemedText className="text-base font-semibold">{t('fastBookNearestSlots')}</ThemedText>
      </HomeFastBookRowInset>
      {branchGroups.map((branch) => (
        <HomeFastBookRowInset key={branch.branchId}>
          <ThemedText className="mb-2 text-sm font-semibold">{branch.branchName}</ThemedText>
          {groupNearestBranchSlots(branch.slots, locale, todayIso).map((group) => (
            <View key={`${group.slots[0]?.date}-${group.dayLabel}`} className="mb-2 w-full gap-1.5">
              <ThemedText className="text-sm font-normal text-light-subtext dark:text-dark-subtext">
                {group.dayLabel}
              </ThemedText>
              <View className="w-full flex-row flex-wrap">
                {group.slots.map((slot) => {
                  const key = nearestBranchHomeSlotSelectionKey(slot);
                  return (
                    <SlotTimePill
                      key={key}
                      compact
                      spaced
                      selected={selectedSlotKey === key}
                      title={`${formatNextSlotDisplayTime(slot.time)} · ${firstName(slot.employeeName)}`}
                      onPress={() => onSelectSlot(slot)}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </HomeFastBookRowInset>
      ))}
    </View>
  );
}
