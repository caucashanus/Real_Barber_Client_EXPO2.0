import { router } from 'expo-router';
import React from 'react';
import { Alert, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { cancelBooking, type Booking } from '@/api/bookings';
import { PROFILE_BOOKINGS_ROUTE } from '@/constants/profileContacts';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingsBadgeContext';
import AppButton from '@/components/AppButton';
import { Button } from '@/components/Button';
import ConfirmationModal from '@/components/ConfirmationModal';
import Icon from '@/components/Icon';
import ThemedFooter from '@/components/ThemeFooter';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';
import type { TranslationKey } from '@/locales';
import {
  buildBookingRepeatCreateHref,
  buildReservationReviewContextQuery,
} from '@/utils/bookingDetailHelpers';
import { canShareClientBooking } from '@/utils/bookingHelpers';
import {
  bookingFooterShowCancel,
  bookingFooterShowReschedule,
  getClientBookingUiStatus,
} from '@/utils/bookingManage';
import { invalidateListingAvailability } from '@/lib/availability/listingCache';

const INVERT_SECONDARY_BUTTON =
  'h-11 min-h-[44px] border-0 bg-black py-0 active:opacity-90 dark:bg-white';
const INVERT_SECONDARY_TEXT = 'text-sm font-bold text-white dark:text-black';

interface GuestManageFooterHandlers {
  cancelling: boolean;
  onCancelConfirm: () => void | Promise<void>;
  onReschedulePress: () => void;
}

interface BookingDetailFooterActionsProps {
  booking: Booking;
  hasReview: boolean;
  confirmingAttendance: boolean;
  cancelMessage: string;
  cancelSheetRef: React.RefObject<ActionSheetRef | null>;
  onShare: () => void;
  t: (key: TranslationKey) => string;
  /** Magic link guest manage — cancel/reschedule bez Bearer tokenu. */
  guestManage?: GuestManageFooterHandlers;
}

export default function BookingDetailFooterActions({
  booking,
  hasReview,
  confirmingAttendance,
  cancelMessage,
  cancelSheetRef,
  onShare,
  t,
  guestManage,
}: BookingDetailFooterActionsProps) {
  const { apiToken } = useAuth();
  const { refresh: refreshBookings } = useBookings();
  const { isDark } = useThemeColors();

  const uiStatus = getClientBookingUiStatus(booking);
  const canShare = canShareClientBooking(booking);
  const repeatHref = buildBookingRepeatCreateHref(booking);
  const showReschedule = bookingFooterShowReschedule(booking, uiStatus);
  const showCancel = bookingFooterShowCancel(booking, uiStatus);
  const invertIconColor = isDark ? '#000000' : '#FFFFFF';

  const reviewHref = `/screens/review?entityType=reservation&entityId=${encodeURIComponent(booking.id)}&entityName=${encodeURIComponent(booking.item?.name ?? booking.branch?.name ?? 'Booking')}${booking.item?.imageUrl ? `&entityImage=${encodeURIComponent(booking.item.imageUrl)}` : ''}${booking.employee?.name ? `&entityEmployeeName=${encodeURIComponent(booking.employee.name)}` : ''}${booking.employee?.avatarUrl ? `&entityEmployeeAvatar=${encodeURIComponent(booking.employee.avatarUrl)}` : ''}${buildReservationReviewContextQuery(booking)}`;

  const showUpcomingBar = uiStatus === 'upcoming' && (showReschedule || showCancel);

  return (
    <>
      <ThemedFooter>
        {uiStatus === 'cancelled' || uiStatus === 'no_show' ? (
          <AppButton
            variant="secondary"
            size="lg"
            rounded="md"
            fullWidth
            href={repeatHref}
            className={INVERT_SECONDARY_BUTTON}
            textClassName={INVERT_SECONDARY_TEXT}>
            <View className="flex-row items-center justify-center gap-2">
              <Icon name="CalendarClock" size={16} color={invertIconColor} strokeWidth={2} />
              <ThemedText className={INVERT_SECONDARY_TEXT}>{t('bookingDetailNewBookingCta')}</ThemedText>
            </View>
          </AppButton>
        ) : null}

        {uiStatus === 'inProgress' && canShare ? (
          <AppButton
            variant="secondary"
            size="lg"
            rounded="md"
            fullWidth
            className={INVERT_SECONDARY_BUTTON}
            textClassName={INVERT_SECONDARY_TEXT}
            onPress={onShare}>
            <View className="flex-row items-center justify-center gap-2">
              <Icon name="Share" size={16} color={invertIconColor} strokeWidth={2} />
              <ThemedText className={INVERT_SECONDARY_TEXT}>{t('bookingShareDetailButton')}</ThemedText>
            </View>
          </AppButton>
        ) : null}

        {uiStatus === 'past' ? (
          <View className="flex-row overflow-hidden rounded-2xl bg-light-surface dark:bg-dark-secondary">
            <Button
              variant="ghost"
              size="small"
              title={t('bookingDetailRepeatReservation')}
              iconStart="CalendarPlus"
              iconSize={16}
              className="min-w-0 flex-1 rounded-none px-0 py-3.5"
              textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
              href={repeatHref}
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
              href={reviewHref}
            />
          </View>
        ) : null}

        {showUpcomingBar ? (
          <View className="flex-row overflow-hidden rounded-2xl bg-light-surface dark:bg-dark-secondary">
            {showReschedule ? (
              <Button
                variant="ghost"
                size="small"
                title={t('bookingDetailMoveButton')}
                iconStart="Calendar"
                iconSize={16}
                disabled={confirmingAttendance}
                className="min-w-0 flex-1 rounded-none px-0 py-3.5"
                textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                href={
                  guestManage
                    ? undefined
                    : `/screens/reschedule?id=${encodeURIComponent(booking.id)}`
                }
                onPress={guestManage ? guestManage.onReschedulePress : undefined}
              />
            ) : null}
            {showReschedule && showCancel ? (
              <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />
            ) : null}
            {showCancel ? (
              <Button
                variant="ghost"
                size="small"
                title={t('bookingDetailCancelButton')}
                iconStart="X"
                iconSize={16}
                disabled={confirmingAttendance || guestManage?.cancelling}
                className="min-w-0 flex-1 rounded-none px-0 py-3.5"
                textClassName="text-sm font-semibold text-red-600 dark:text-red-400"
                onPress={() => cancelSheetRef.current?.show()}
              />
            ) : null}
          </View>
        ) : null}
      </ThemedFooter>

      {showCancel ? (
        <ConfirmationModal
          actionSheetRef={cancelSheetRef}
          title={t('bookingDetailCancelBooking')}
          message={cancelMessage}
          cancelText={t('bookingDetailCancelNo')}
          confirmText={t('bookingDetailCancelYes')}
          onCancel={() => {}}
          onConfirm={() => {
            if (guestManage) {
              void guestManage.onCancelConfirm();
              return;
            }
            if (!apiToken) return;
            cancelBooking(apiToken, booking.id)
              .then(() => refreshBookings({ force: true }))
              .then(() => {
                invalidateListingAvailability({
                  employeeId: booking.employeeId,
                  branchId: booking.branchId,
                  serviceId: booking.itemId,
                });
              })
              .then(() => {
                router.replace(PROFILE_BOOKINGS_ROUTE);
              })
              .catch((e) => {
                Alert.alert(
                  t('bookingDetailCancelError'),
                  e instanceof Error ? e.message : String(e)
                );
              });
          }}
        />
      ) : null}
    </>
  );
}
