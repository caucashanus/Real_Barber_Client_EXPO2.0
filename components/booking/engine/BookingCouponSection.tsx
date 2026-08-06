import React, { useRef } from 'react';
import { Pressable, View } from 'react-native';

import type { BookingEngineCoupon } from '@/hooks/useBookingEngineCoupon';
import BookingDiscountCodeSheet, {
  type BookingDiscountCodeSheetHandle,
} from '@/components/booking/engine/BookingDiscountCodeSheet';
import BookingGiftVoucherSheet, {
  type BookingGiftVoucherSheetHandle,
} from '@/components/booking/engine/BookingGiftVoucherSheet';
import BookingCouponPriceBreakdown from '@/components/booking/engine/BookingCouponPriceBreakdown';
import AppButton from '@/components/AppButton';
import Icon from '@/components/Icon';
import SheetNavRow from '@/components/shared/SheetNavRow';
import ThemedText from '@/components/ThemedText';
import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';

interface Props {
  flow: BookingEngineFlow;
  coupon: BookingEngineCoupon;
  onReserve: () => void;
  plain?: boolean;
}

export default function BookingCouponSection({ flow, coupon, onReserve, plain = false }: Props) {
  const { t } = flow;
  const discountRef = useRef<BookingDiscountCodeSheetHandle>(null);
  const giftRef = useRef<BookingGiftVoucherSheetHandle>(null);
  const [expanded, setExpanded] = React.useState(false);

  if (!coupon.couponEligible) return null;

  const openDiscount = () => {
    flow.trackOpenDiscountCode();
    coupon.invalidatePreview();
    discountRef.current?.show();
  };

  const openGift = () => {
    flow.trackOpenGiftVoucher();
    giftRef.current?.show();
  };

  if (plain) {
    const valueLabel = coupon.preview?.couponName ?? '—';

    return (
      <>
        <View>
          <View className="mt-4">
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('bookingCouponChoiceTitle')}
            </ThemedText>
            <Pressable
              onPress={() => setExpanded((v) => !v)}
              className="mt-1 active:opacity-80">
              <ThemedText className="text-sm font-semibold">{valueLabel}</ThemedText>
            </Pressable>
          </View>

          {expanded ? (
            <View className="mt-3 items-start gap-2">
              <AppButton
                title={t('bookingDiscountCodeOption')}
                variant="choice"
                size="sm"
                rounded="lg"
                className="self-start"
                onPress={openDiscount}
              />
              <AppButton
                title={t('bookingGiftVoucherOption')}
                variant="choice"
                size="sm"
                rounded="lg"
                className="self-start"
                onPress={openGift}
              />
            </View>
          ) : null}

          {coupon.preview && !expanded ? (
            <BookingCouponPriceBreakdown preview={coupon.preview} t={t} plain={plain} />
          ) : null}
        </View>

        <BookingDiscountCodeSheet
          ref={discountRef}
          flow={flow}
          coupon={coupon}
          onReserve={onReserve}
        />
        <BookingGiftVoucherSheet ref={giftRef} t={t} />
      </>
    );
  }

  return (
    <>
      <View className={plain ? 'mt-0' : 'mt-5'}>
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          className={
            plain
              ? 'flex-row items-center justify-between py-3 active:opacity-80'
              : 'flex-row items-center justify-between rounded-2xl border border-light-secondary bg-light-secondary px-4 py-3 dark:border-dark-secondary dark:bg-dark-secondary active:opacity-80'
          }>
          <ThemedText className="text-sm font-semibold">{t('bookingCouponChoiceTitle')}</ThemedText>
          <Icon
            name={expanded ? 'ChevronUp' : 'ChevronDown'}
            size={18}
            className="text-light-subtext dark:text-dark-subtext"
          />
        </Pressable>

        {expanded ? (
          <View className={plain ? 'mt-1' : 'mt-2 overflow-hidden rounded-2xl border border-light-secondary dark:border-dark-secondary'}>
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

      <BookingDiscountCodeSheet
        ref={discountRef}
        flow={flow}
        coupon={coupon}
        onReserve={onReserve}
      />
      <BookingGiftVoucherSheet ref={giftRef} t={t} />
    </>
  );
}
