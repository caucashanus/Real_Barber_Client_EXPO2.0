import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { Booking } from '@/api/bookings';
import { useSetTransferRecipient } from '@/contexts/TransferRecipientContext';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import ListLink from '@/components/ListLink';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import { barberDetailHref } from '@/constants/profileDetailRoutes';

interface BookingDetailEmployeeSectionProps {
  booking: Booking;
  t: (key: TranslationKey) => string;
}

export default function BookingDetailEmployeeSection({
  booking,
  t,
}: BookingDetailEmployeeSectionProps) {
  const setTransferRecipient = useSetTransferRecipient();
  const employeeId = booking.employee?.id;

  const openEmployeeProfile = () => {
    if (!employeeId) return;
    router.push(barberDetailHref(employeeId) as never);
  };

  const employeeSummary = (
    <>
      <Avatar
        src={booking.employee?.avatarUrl ?? undefined}
        name={booking.employee?.name}
        size="lg"
      />
      <View className="ml-3 min-w-0 flex-1">
        <ThemedText className="text-lg font-semibold">
          {booking.employee?.name ?? '—'}
        </ThemedText>
        {booking.item?.name ? (
          <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
            {booking.item.name}
          </ThemedText>
        ) : null}
      </View>
    </>
  );

  return (
    <Section title={t('bookingInCareOf')} titleSize="lg" className="px-global pt-4">
      <View className="mb-4 mt-4 flex-row items-center justify-between">
        {employeeId ? (
          <Pressable
            onPress={openEmployeeProfile}
            accessibilityRole="button"
            accessibilityLabel={t('bookingOpenEmployeeProfile')}
            className="min-w-0 flex-1 flex-row items-center active:opacity-70">
            {employeeSummary}
          </Pressable>
        ) : (
          <View className="min-w-0 flex-1 flex-row items-center">{employeeSummary}</View>
        )}
        {employeeId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('bookingOpenEmployeeProfile')}
            hitSlop={12}
            onPress={openEmployeeProfile}
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
        className="rounded-xl bg-light-surface px-4 py-3 dark:bg-dark-secondary"
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
  );
}
