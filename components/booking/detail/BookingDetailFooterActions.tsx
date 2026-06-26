import { router } from 'expo-router';
import React from 'react';
import { Alert, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { cancelBooking, type Booking } from '@/api/bookings';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBookings } from '@/app/contexts/BookingsBadgeContext';
import { Button } from '@/components/Button';
import ConfirmationModal from '@/components/ConfirmationModal';
import LiveIndicator from '@/components/LiveIndicator';
import ThemedFooter from '@/components/ThemeFooter';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface BookingDetailFooterActionsProps {
  booking: Booking;
  hasReview: boolean;
  isCancelled: boolean;
  isCurrent: boolean;
  isPast: boolean;
  isUpcoming: boolean;
  cancelMessage: string;
  cancelSheetRef: React.RefObject<ActionSheetRef | null>;
  t: (key: TranslationKey) => string;
}

export default function BookingDetailFooterActions({
  booking,
  hasReview,
  isCancelled,
  isCurrent,
  isPast,
  isUpcoming,
  cancelMessage,
  cancelSheetRef,
  t,
}: BookingDetailFooterActionsProps) {
  const { apiToken } = useAuth();
  const { refresh: refreshBookings } = useBookings();

  return (
    <>
      <ThemedFooter>
        <View className="flex-row overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
          {isCancelled && (
            <View className="flex-1 flex-row items-center justify-center gap-2 py-3.5">
              <ThemedText className="text-sm font-semibold text-red-500 dark:text-red-400">
                Zrušená rezervace
              </ThemedText>
            </View>
          )}
          {isCurrent && (
            <View className="flex-1 flex-row items-center justify-center gap-2 py-3.5">
              <LiveIndicator variant="green" size="default" />
              <ThemedText className="text-sm font-semibold">
                {t('bookingStatusInProgress')}
              </ThemedText>
            </View>
          )}
          {isPast && (
            <>
              <Button
                variant="ghost"
                size="small"
                title={t('bookingDetailRepeatReservation')}
                iconStart="CalendarPlus"
                iconSize={16}
                className="min-w-0 flex-1 rounded-none px-0 py-3.5"
                textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                href={`/screens/reservation-create?branchId=${encodeURIComponent(booking.branchId)}&employeeId=${encodeURIComponent(booking.employeeId)}&itemId=${encodeURIComponent(booking.itemId)}&itemName=${encodeURIComponent(booking.item?.name ?? '')}`}
              />
              <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />
              <Button
                variant="ghost"
                size="small"
                title={hasReview ? t('reviewUpdate') : t('branchReview')}
                iconStart="Star"
                iconSize={16}
                className="min-w-0 flex-1 rounded-none px-0 py-3.5"
                textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                href={`/screens/review?entityType=reservation&entityId=${encodeURIComponent(booking.id)}&entityName=${encodeURIComponent(booking.item?.name ?? booking.branch?.name ?? 'Booking')}${booking.item?.imageUrl ? `&entityImage=${encodeURIComponent(booking.item.imageUrl)}` : ''}${booking.employee?.name ? `&entityEmployeeName=${encodeURIComponent(booking.employee.name)}` : ''}${booking.employee?.avatarUrl ? `&entityEmployeeAvatar=${encodeURIComponent(booking.employee.avatarUrl)}` : ''}`}
              />
            </>
          )}
          {isUpcoming && (
            <>
              <Button
                variant="ghost"
                size="small"
                title={t('bookingDetailMoveButton')}
                iconStart="Calendar"
                iconSize={16}
                className="min-w-0 flex-1 rounded-none px-0 py-3.5"
                textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                href={`/screens/reschedule?id=${encodeURIComponent(booking.id)}`}
              />
              <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />
              <Button
                variant="ghost"
                size="small"
                title={t('bookingDetailCancelButton')}
                iconStart="X"
                iconSize={16}
                className="min-w-0 flex-1 rounded-none px-0 py-3.5"
                textClassName="text-sm font-semibold text-red-600 dark:text-red-400"
                onPress={() => cancelSheetRef.current?.show()}
              />
            </>
          )}
        </View>
      </ThemedFooter>
      {isUpcoming && (
        <ConfirmationModal
          actionSheetRef={cancelSheetRef}
          title={t('bookingDetailCancelBooking')}
          message={cancelMessage}
          cancelText={t('bookingDetailCancelNo')}
          confirmText={t('bookingDetailCancelYes')}
          onCancel={() => {}}
          onConfirm={() => {
            if (!apiToken) return;
            cancelBooking(apiToken, booking.id)
              .then(() => refreshBookings({ force: true }))
              .then(() => {
                router.back();
              })
              .catch((e) => {
                Alert.alert(
                  t('bookingDetailCancelError'),
                  e instanceof Error ? e.message : String(e)
                );
              });
          }}
        />
      )}
    </>
  );
}
