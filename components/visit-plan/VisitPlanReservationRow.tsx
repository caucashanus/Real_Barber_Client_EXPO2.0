import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  formatVisitPlanBookingMetaLine,
  formatVisitPlanBookingWhenLine,
} from '@/utils/visitPlanBookingDisplay';
import type { VisitPlanPastBooking } from '@/utils/visitPlanPastBookingTypes';

type Props = {
  booking: VisitPlanPastBooking;
  onPress?: () => void;
  showDivider?: boolean;
};

export default function VisitPlanReservationRow({
  booking,
  onPress,
  showDivider = false,
}: Props) {
  const { locale } = useLanguage();
  const serviceLabel = booking.serviceLabel?.trim() || '—';
  const metaLine = formatVisitPlanBookingMetaLine(booking);
  const whenLine = formatVisitPlanBookingWhenLine(booking, locale);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push(`/screens/booking-detail?id=${encodeURIComponent(booking.id)}` as never);
  };

  return (
    <Pressable onPress={handlePress} className="w-full active:opacity-70">
      {showDivider ? <View className="h-px bg-light-secondary dark:bg-dark-secondary" /> : null}
      <View className="flex-row items-center gap-3 py-3">
        <Avatar
          size="md"
          src={booking.avatarUrl ?? undefined}
          name={booking.employeeName || serviceLabel}
        />
        <View className="min-w-0 flex-1">
          <ThemedText className="text-base font-semibold" numberOfLines={1}>
            {serviceLabel}
          </ThemedText>
          {metaLine ? (
            <ThemedText
              className="text-sm text-light-subtext dark:text-dark-subtext"
              numberOfLines={1}>
              {metaLine}
            </ThemedText>
          ) : null}
          {whenLine ? (
            <ThemedText className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext">
              {whenLine}
            </ThemedText>
          ) : null}
        </View>
        <Icon name="ChevronRight" size={20} className="text-light-subtext dark:text-dark-subtext" />
      </View>
    </Pressable>
  );
}
