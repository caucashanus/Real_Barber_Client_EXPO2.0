import type { Booking } from '@/api/bookings';
import React from 'react';
import { Pressable, View } from 'react-native';

import Icon from '@/components/Icon';
import SurfaceCard from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';
import type { TranslationKey } from '@/locales';
import { formatKidsWatchBookingDateBranch } from '@/utils/kidsWatchBookingDisplay';

const BENEFIT_KEYS = [
  'kidsWatchBenefitPin',
  'kidsWatchBenefitArrivalDeparture',
  'kidsWatchBenefitTreats',
  'kidsWatchBenefitHaircutPhoto',
] as const;

export function KidsWatchPromoBenefits({ t }: { t: (key: TranslationKey) => string }) {
  return (
    <View className="mt-5 py-3">
      {BENEFIT_KEYS.map((key) => (
        <View key={key} className="flex-row gap-3 py-2.5">
          <View className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-light-text dark:bg-dark-text" />
          <ThemedText className="flex-1 text-sm leading-snug">{t(key)}</ThemedText>
        </View>
      ))}
    </View>
  );
}

export function KidsWatchBookingMeta({
  booking,
  locale,
  t,
}: {
  booking: Booking;
  locale: string;
  t: (key: TranslationKey) => string;
}) {
  return (
    <SurfaceCard rounded="2xl" className="p-3">
      <ThemedText className="text-base font-medium" numberOfLines={2}>
        {booking.item?.name?.trim() || t('homeRecentDefaultName')}
      </ThemedText>
      <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext" numberOfLines={2}>
        {formatKidsWatchBookingDateBranch(booking, locale)}
      </ThemedText>
    </SurfaceCard>
  );
}

export function KidsWatchNotifyToggleRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className="mb-2 flex-row items-center gap-3 rounded-xl px-2 py-3 active:opacity-70">
      <View
        className={`h-6 w-6 items-center justify-center rounded-md border ${
          checked
            ? 'border-transparent bg-light-text dark:bg-dark-text'
            : 'border-light-subtext/40 dark:border-dark-subtext/40'
        }`}>
        {checked ? <Icon name="Check" size={16} color={colors.bg} strokeWidth={3} /> : null}
      </View>
      <ThemedText className="flex-1 text-sm">{label}</ThemedText>
    </Pressable>
  );
}