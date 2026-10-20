import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import type { Booking } from '@/api/bookings';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import SiteLoadingState from '@/components/SiteLoadingState';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { formatHomeBookingDateLabel } from '@/utils/homeSpotlight';
import { pickRecentHomeBookings } from '@/utils/pickRecentHomeBookings';

type Props = {
  bookings: Booking[] | null | undefined;
  loading?: boolean;
  /** Pod fast-book listou — bez nadpisu, vizuálně jeden blok. */
  integrated?: boolean;
};

function recentBookingMetaLine(booking: Booking): string {
  return [
    booking.employee?.name?.trim(),
    booking.branch?.name?.trim(),
    formatHomeBookingDateLabel(booking),
  ]
    .filter(Boolean)
    .join(' · ');
}

export default function HomeRecentBookingsSection({
  bookings,
  loading,
  integrated = false,
}: Props) {
  const { client, apiToken } = useAuth();
  const { t } = useTranslation();

  const recent = useMemo(
    () => (bookings == null ? [] : pickRecentHomeBookings(bookings, 2)),
    [bookings]
  );

  if (!client && !apiToken) return null;

  if (loading && bookings == null) {
    if (!integrated) {
      return (
        <View className="mt-6">
          <ThemedText className="mb-3 text-lg font-semibold">{t('homeRecentTitle')}</ThemedText>
          <SiteLoadingState layout="inline" />
        </View>
      );
    }
    return (
      <View className="pt-1">
        <SiteLoadingState layout="inline" className="py-3" />
      </View>
    );
  }

  if (recent.length === 0) return null;

  const list = (
    <View className={integrated ? 'pl-0.5 pt-1' : 'mt-2'}>
      {recent.map((booking, index) => {
        const meta = recentBookingMetaLine(booking);
        return (
          <Pressable
            key={booking.id}
            onPress={() =>
              router.push(`/screens/booking-detail?id=${encodeURIComponent(booking.id)}` as never)
            }
            className="w-full active:opacity-70">
            {index > 0 ? <View className="h-px bg-neutral-200 dark:bg-neutral-700" /> : null}
            <View className="flex-row items-center gap-3 py-3">
              <Avatar
                size="md"
                src={booking.employee?.avatarUrl ?? undefined}
                name={booking.employee?.name ?? undefined}
                className="h-12 w-12 shrink-0"
              />
              <View className="min-w-0 flex-1">
                <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                  {booking.item?.name?.trim() || t('homeRecentDefaultName')}
                </ThemedText>
                {meta ? (
                  <ThemedText
                    className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext"
                    numberOfLines={1}>
                    {meta}
                  </ThemedText>
                ) : null}
              </View>
              <Icon
                name="ChevronRight"
                size={18}
                className="text-light-subtext dark:text-dark-subtext"
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  if (integrated) return list;

  return (
    <View className="mt-6">
      <ThemedText className="mb-0 text-lg font-semibold">{t('homeRecentTitle')}</ThemedText>
      {list}
    </View>
  );
}
