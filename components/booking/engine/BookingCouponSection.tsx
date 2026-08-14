import React from 'react';
import { Pressable, View } from 'react-native';

import type { BookingEngineCoupon } from '@/hooks/useBookingEngineCoupon';
import BookingCouponPriceBreakdown from '@/components/booking/engine/BookingCouponPriceBreakdown';
import { useBookingCouponSheets } from '@/components/booking/engine/BookingCouponSheetsHost';
import Icon from '@/components/Icon';
import SheetNavRow from '@/components/shared/SheetNavRow';
import ThemedText from '@/components/ThemedText';
import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';

interface Props {
  flow: BookingEngineFlow;
  coupon: BookingEngineCoupon;
  plain?: boolean;
}

export default function BookingCouponSection({ flow, coupon, plain = false }: Props) {
  const { t } = flow;
  const couponSheets = useBookingCouponSheets();
  const [expanded, setExpanded] = React.useState(false);

  if (!coupon.couponEligible) return null;

  const openDiscount = () => {
    if (couponSheets) {
      couponSheets.openDiscountSheet();
      return;
    }
    flow.trackOpenDiscountCode();
    coupon.invalidatePreview();
  };

  const openGift = () => {
    couponSheets?.openGiftVoucherSheet();
  };

  return (
    <View className={plain ? 'mt-4' : 'mt-5'}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className={
          plain
            ? 'active:opacity-80'
            : 'flex-row items-center justify-between rounded-2xl border border-light-secondary bg-light-secondary px-4 py-3 dark:border-dark-secondary dark:bg-dark-secondary active:opacity-80'
        }>
        {plain ? (
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('bookingCouponChoiceTitle')}
              </ThemedText>
              {coupon.preview?.couponName ? (
                <ThemedText className="mt-1 text-sm font-semibold">{coupon.preview.couponName}</ThemedText>
              ) : null}
            </View>
            <Icon
              name={expanded ? 'ChevronUp' : 'ChevronDown'}
              size={18}
              className="shrink-0 text-light-subtext dark:text-dark-subtext"
            />
          </View>
        ) : (
          <>
            <ThemedText className="text-sm font-semibold">{t('bookingCouponChoiceTitle')}</ThemedText>
            <Icon
              name={expanded ? 'ChevronUp' : 'ChevronDown'}
              size={18}
              className="text-light-subtext dark:text-dark-subtext"
            />
          </>
        )}
      </Pressable>

      {expanded ? (
        <View
          className={
            plain
              ? 'mt-2 overflow-hidden rounded-2xl border border-light-secondary dark:border-dark-secondary'
              : 'mt-2 overflow-hidden rounded-2xl border border-light-secondary dark:border-dark-secondary'
          }>
          <SheetNavRow
            label={t('bookingDiscountCodeOption')}
            onPress={openDiscount}
            icon={<Icon name="Tag" size={18} className="text-light-text dark:text-dark-text" />}
          />
          <View className="h-px bg-light-border dark:bg-dark-border" />
          <SheetNavRow
            label={t('bookingGiftVoucherOption')}
            onPress={openGift}
            icon={<Icon name="Gift" size={18} className="text-light-text dark:text-dark-text" />}
          />
        </View>
      ) : null}

      {coupon.preview && !expanded ? (
        <BookingCouponPriceBreakdown preview={coupon.preview} t={t} plain={plain} />
      ) : null}
    </View>
  );
}
