import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { Booking } from '@/api/bookings';
import { useSetTransferRecipient } from '@/app/contexts/TransferRecipientContext';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import ListLink from '@/components/ListLink';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

interface BookingDetailEmployeeSectionProps {
  booking: Booking;
  t: (key: TranslationKey) => string;
}

export default function BookingDetailEmployeeSection({
  booking,
  t,
}: BookingDetailEmployeeSectionProps) {
  const setTransferRecipient = useSetTransferRecipient();

  return (
    <>
      <Divider className="h-2 bg-light-secondary dark:bg-dark-darker" />

      <Section title={t('bookingInCareOf')} titleSize="lg" className="px-global pt-4">
        <View className="mb-4 mt-4 flex-row items-center justify-between">
          <View className="min-w-0 flex-1 flex-row items-center">
            <Avatar
              src={booking.employee?.avatarUrl ?? undefined}
              name={booking.employee?.name}
              size="lg"
            />
            <View className="ml-3 min-w-0 flex-1">
              <ThemedText variant="h4">
                {booking.employee?.name ?? '—'}
              </ThemedText>
              {booking.item?.name ? (
                <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
                  {booking.item.name}
                </ThemedText>
              ) : null}
            </View>
          </View>
          {booking.employee?.id ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('bookingOpenEmployeeProfile')}
              hitSlop={12}
              onPress={() =>
                router.push(`/screens/barber-detail?id=${encodeURIComponent(booking.employee!.id)}`)
              }
              className="ml-2 shrink-0 rounded-full bg-light-secondary p-2.5 dark:bg-dark-secondary">
              <Icon name="CircleUserRound" size={22} />
            </Pressable>
          ) : null}
        </View>
        <ListLink
          icon="Gift"
          title={t('bookingSendRbcTip')}
          description={t('bookingSendRbcTip')}
          showChevron
          className="rounded-xl bg-light-secondary px-4 py-3 dark:bg-dark-secondary"
          onPress={() => {
            const emp = booking.employee;
            if (!emp?.id) return;
            setTransferRecipient({
              id: emp.id,
              name: emp.name ?? '—',
              type: 'EMPLOYEE',
              avatarUrl: emp.avatarUrl ?? undefined,
            });
            router.push(`/screens/transfer-chat/${emp.id}`);
          }}
        />
      </Section>
    </>
  );
}
