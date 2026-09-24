import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { formatResolvedBookingPriceLabel } from '@/lib/booking/designShared';
import {
  bookingContactDisplayName,
  clientToBookingReservationContact,
} from '@/lib/booking/authContact';
import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import BookingCouponSection from '@/components/booking/engine/BookingCouponSection';
import BookingHoldSummaryRow, {
  shouldShowBookingHoldSummaryRow,
} from '@/components/booking/engine/BookingHoldSummaryRow';
import BookingSummaryBranchSection from '@/components/booking/engine/BookingSummaryBranchSection';
import Section from '@/components/layout/Section';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { resolveSummaryEmployeeDisplayName } from '@/lib/booking/submitReadiness';
import { formatBookingSummaryDatetimeLabel } from '@/utils/reservationCreateHelpers';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  flow: BookingEngineFlow;
}

export default function BookingEngineSummaryStep({ flow }: Props) {
  const { client } = useAuth();
  const { t, coupon } = flow;

  const reservationContact = useMemo(
    () => clientToBookingReservationContact(client),
    [client]
  );
  const profileIncomplete = !flow.submit.bookingContactReady;

  if (!flow.selectedSlot) {
    return (
      <ThemedText className="text-sm text-amber-700 dark:text-amber-300">
        {t('bookingSummaryMissingSlot')}
      </ThemedText>
    );
  }

  const employeeName = resolveSummaryEmployeeDisplayName({
    selectedEmployee: flow.selectedEmployee,
    profileEmployee: flow.profileEmployee,
    selectedSlot: flow.selectedSlot,
    holdEmployeeId: flow.hold.hold?.employeeId,
    employees: flow.employees,
  });
  const dateLabel = formatBookingSummaryDatetimeLabel({
    dateIso: flow.selectedDate,
    slotStart: flow.selectedSlot?.start,
    slotEnd: flow.selectedSlot?.end,
    todayIso: flow.todayIso,
    dateLocaleTag: flow.dateLocaleTag,
  });

  const rows: Array<{ titleKey: TranslationKey; label: string }> = [
    { titleKey: 'bookingProgressDatetime', label: dateLabel },
    { titleKey: 'bookingProgressService', label: flow.selectedService?.name ?? '—' },
    { titleKey: 'haircutBarber', label: employeeName },
  ];

  const priceLabel =
    !coupon.preview
      ? formatResolvedBookingPriceLabel(
          flow.resolvedBookingPrice,
          t('reservationPriceFromPrefix'),
          t('reservationCurrencySuffix')
        )
      : undefined;

  if (priceLabel) {
    rows.push({
      titleKey: 'bookingSummaryPrice',
      label: priceLabel,
    });
  }

  return (
    <View className="gap-5">
      <Section title={t('reservationSummaryTitle')} titleSize="lg" className="mt-6">
        <View className="mt-2">
          <BookingHoldSummaryRow flow={flow} plain />
          {rows.slice(0, 1).map((row, index) => (
            <View
              key={row.titleKey}
              className={
                index > 0 || shouldShowBookingHoldSummaryRow(flow) ? 'mt-4' : undefined
              }>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t(row.titleKey)}
              </ThemedText>
              <ThemedText className="mt-1 text-sm font-semibold">{row.label}</ThemedText>
            </View>
          ))}
          <BookingSummaryBranchSection
            branchName={flow.selectedBranch?.name ?? '—'}
            branchAddress={flow.selectedBranch?.address}
            topClassName="mt-4"
          />
          {rows.slice(1).map((row) => (
            <View key={row.titleKey} className="mt-4">
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t(row.titleKey)}
              </ThemedText>
              <ThemedText className="mt-1 text-sm font-semibold">{row.label}</ThemedText>
            </View>
          ))}

          <BookingCouponSection flow={flow} coupon={coupon} plain />
        </View>
      </Section>

      <Section title={t('bookingSummaryProfileSection')} titleSize="md">
        {profileIncomplete ? (
          <View className="mt-2 gap-3">
            <ThemedText className="text-sm text-amber-700 dark:text-amber-300">
              {t('bookingSummaryProfileIncomplete')}
            </ThemedText>
            <Pressable
              onPress={() => router.push('/screens/edit-profile')}
              className="flex-row items-center gap-2 self-start rounded-full bg-light-surface px-4 py-2 active:opacity-80 dark:bg-dark-secondary">
              <Icon name="UserRoundPen" size={18} className="text-light-text dark:text-dark-text" />
              <ThemedText className="text-sm font-semibold">
                {t('bookingSummaryEditProfile')}
              </ThemedText>
            </Pressable>
          </View>
        ) : reservationContact ? (
          <View className="mt-2 gap-3">
            <View>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('editProfilePersonalInfo')}
              </ThemedText>
              <ThemedText className="mt-1 text-sm font-semibold">
                {bookingContactDisplayName(reservationContact)}
              </ThemedText>
            </View>
            <View>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('editProfileEmail')}
              </ThemedText>
              <ThemedText className="mt-1 text-sm font-semibold">{reservationContact.email}</ThemedText>
            </View>
            <View>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('editProfilePhone')}
              </ThemedText>
              <ThemedText className="mt-1 text-sm font-semibold">{reservationContact.phone}</ThemedText>
            </View>
          </View>
        ) : null}
      </Section>

      {!flow.bookingSubmitReady && flow.bookingSubmitBlockReason !== 'contact' ? (
        <ThemedText className="text-sm text-amber-700 dark:text-amber-300">
          {flow.bookingSubmitBlockReason === 'employee'
            ? t('bookingSummaryMissingBarber')
            : flow.bookingSubmitBlockReason === 'hold'
              ? t('bookingSummaryMissingHold')
              : t('bookingSummaryMissingSlot')}
        </ThemedText>
      ) : null}

      {flow.submit.submitError ? (
        <ThemedText className="text-sm text-red-500 dark:text-red-400">
          {flow.submit.submitError}
        </ThemedText>
      ) : null}
    </View>
  );
}
