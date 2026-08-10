import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { Booking } from '@/api/bookings';
import AppButton from '@/components/AppButton';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { buildRepeatReservationHref } from '@/utils/repeatBooking';

const REPEAT_OUTLINE_BUTTON = {
  variant: 'outline' as const,
  size: 'sm' as const,
  rounded: 'full' as const,
  className: 'px-2.5 py-1',
  iconSize: 13,
  textClassName: 'text-xs font-semibold leading-tight',
};

export function HomeRepeatBookingCard({
  booking,
  t,
}: {
  booking: Booking;
  t: (key: TranslationKey) => string;
}) {
  const itemName = booking.item?.name?.trim();
  const branchName = booking.branch?.name?.trim();
  const employeeName = booking.employee?.name?.trim();

  const openRepeat = () => router.push(buildRepeatReservationHref(booking) as never);
  const showBottomActions = Boolean(itemName || branchName);

  return (
    <View className="mb-2">
      <View className="flex-row overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
        <View className="min-w-0 flex-1">
          <Pressable onPress={openRepeat} accessibilityRole="button" className="active:opacity-70">
            <View className={`flex-row items-center gap-3 px-4 py-4 ${showBottomActions ? 'pb-3' : ''}`}>
              <Avatar
                src={booking.employee?.avatarUrl ?? undefined}
                name={booking.employee?.name}
                size="md"
              />
              <View className="min-w-0 flex-1">
                <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                  {t('homeRepeatBookingTitle')}
                </ThemedText>
                {employeeName ? (
                  <ThemedText
                    className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext"
                    numberOfLines={1}>
                    {employeeName}
                  </ThemedText>
                ) : null}
              </View>
              <Icon
                name="ChevronRight"
                size={16}
                className="text-light-subtext dark:text-dark-subtext"
              />
            </View>
          </Pressable>

          {showBottomActions ? (
            <View className="flex-row items-center justify-between gap-2 px-4 pb-4 pt-0">
              {itemName ? (
                <ThemedText
                  className="min-w-0 shrink text-xs font-semibold text-light-text dark:text-dark-text"
                  numberOfLines={1}>
                  {itemName}
                </ThemedText>
              ) : null}
              <View className="min-w-0 shrink">
                {branchName ? (
                  <AppButton
                    {...REPEAT_OUTLINE_BUTTON}
                    title={branchName}
                    onPress={openRepeat}
                  />
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
