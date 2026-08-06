import React from 'react';
import { View } from 'react-native';

import type { CouponPreviewSuccess } from '@/api/coupons';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface Props {
  preview: CouponPreviewSuccess;
  t: (key: TranslationKey) => string;
  className?: string;
  plain?: boolean;
}

function formatPrice(value: number): string {
  return value.toLocaleString('cs-CZ', { maximumFractionDigits: 0 });
}

export default function BookingCouponPriceBreakdown({
  preview,
  t,
  className = 'mt-3',
  plain = false,
}: Props) {
  const currency = t('reservationCurrencySuffix');

  return (
    <View
      className={`${plain ? '' : 'rounded-xl bg-light-secondary p-3 dark:bg-dark-secondary'} ${className}`}>
      {preview.couponName ? (
        <ThemedText className="mb-2 text-sm font-semibold">{preview.couponName}</ThemedText>
      ) : null}
      {preview.matchedClient === false ? (
        <ThemedText className="mb-2 text-xs text-amber-700 dark:text-amber-300">
          {t('bookingCouponNotMatchedHint')}
        </ThemedText>
      ) : null}
      <View className="flex-row items-center justify-between py-0.5">
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('reservationCouponOriginalPrice')}
        </ThemedText>
        <ThemedText className="text-sm font-medium">
          {formatPrice(preview.originalPrice)} {currency}
        </ThemedText>
      </View>
      <View className="flex-row items-center justify-between py-0.5">
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('reservationCouponDiscount')}
        </ThemedText>
        <ThemedText className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          −{formatPrice(preview.discountAmount)} {currency}
        </ThemedText>
      </View>
      <View className="mt-1 flex-row items-center justify-between border-t border-light-border pt-2 dark:border-dark-border">
        <ThemedText className="text-sm font-semibold">{t('reservationCouponFinalPrice')}</ThemedText>
        <ThemedText className="text-base font-bold">
          {formatPrice(preview.finalPrice)} {currency}
        </ThemedText>
      </View>
    </View>
  );
}
