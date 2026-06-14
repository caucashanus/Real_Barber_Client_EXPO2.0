import React from 'react';
import { View } from 'react-native';

import type { Booking, BookingCouponUsage } from '@/api/bookings';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

interface BookingDetailPriceSectionProps {
  booking: Booking;
  formatDetailMoney: (value: unknown) => string;
  formatAppliedAt: (iso: string) => string;
  t: (key: TranslationKey) => string;
}

export default function BookingDetailPriceSection({
  booking,
  formatDetailMoney,
  formatAppliedAt,
  t,
}: BookingDetailPriceSectionProps) {
  return (
    <>
      <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

      <Section title={t('bookingPriceDetails')} titleSize="lg" className="px-global pt-4">
        <View className="mt-4 space-y-3">
          {booking.couponUsages && booking.couponUsages.length > 0 ? (
            <View className="space-y-4">
              <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
                {t('bookingCouponSectionTitle')}
              </ThemedText>
              {booking.couponUsages.map((usage: BookingCouponUsage, idx: number) => {
                const amounts = usage.amounts;
                const c = usage.coupon;
                return (
                  <View
                    key={usage.id || `coupon-use-${idx}`}
                    className={
                      idx > 0
                        ? 'border-t border-neutral-400/20 pt-4 dark:border-neutral-500/25'
                        : ''
                    }>
                    {(booking.couponUsages?.length ?? 0) > 1 ? (
                      <ThemedText className="mb-2 text-xs font-semibold text-light-subtext dark:text-dark-subtext">
                        {idx + 1}. {t('bookingCouponUsageShort')}
                      </ThemedText>
                    ) : null}
                    <ThemedText className="text-base font-semibold">{c?.name ?? '—'}</ThemedText>
                    {c?.code ? (
                      <ThemedText className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext">
                        {t('bookingCouponCodeLabel')}: {c.code}
                      </ThemedText>
                    ) : null}
                    <View className="mt-3 space-y-2 rounded-xl bg-light-secondary p-3 dark:bg-dark-secondary">
                      <View className="flex-row justify-between">
                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                          {t('reservationCouponOriginalPrice')}
                        </ThemedText>
                        <ThemedText className="text-sm font-medium">
                          {formatDetailMoney(amounts?.original)} {t('reservationCurrencySuffix')}
                        </ThemedText>
                      </View>
                      <View className="flex-row justify-between">
                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                          {t('reservationCouponDiscount')}
                        </ThemedText>
                        <ThemedText className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          −{formatDetailMoney(amounts?.discount)} {t('reservationCurrencySuffix')}
                        </ThemedText>
                      </View>
                    </View>
                    {usage.appliedAt ? (
                      <ThemedText className="mt-2 text-xs text-light-subtext dark:text-dark-subtext">
                        {t('bookingCouponAppliedAt')}: {formatAppliedAt(usage.appliedAt)}
                      </ThemedText>
                    ) : null}
                  </View>
                );
              })}
              <Divider className="my-2 w-full" />
            </View>
          ) : null}
          <View className="flex-row justify-between">
            <ThemedText className="text-light-subtext dark:text-dark-subtext">
              {booking.item?.name ?? t('bookingServiceFallback')}
            </ThemedText>
            <ThemedText>
              {booking.price} {t('reservationCurrencySuffix')}
            </ThemedText>
          </View>
          <Divider className="my-3" />
          <View className="flex-row justify-between">
            <ThemedText className="text-lg font-bold">{t('bookingTotal')}</ThemedText>
            <ThemedText className="text-lg font-bold">
              {booking.price} {t('reservationCurrencySuffix')}
            </ThemedText>
          </View>
        </View>
      </Section>
    </>
  );
}
