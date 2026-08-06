import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TextInput, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import type { BookingEngineCoupon } from '@/hooks/useBookingEngineCoupon';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import BookingContactSummaryPanel from '@/components/booking/engine/BookingContactSummaryPanel';
import BookingCouponPriceBreakdown from '@/components/booking/engine/BookingCouponPriceBreakdown';
import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import ThemedText from '@/components/ThemedText';

export type BookingDiscountCodeSheetHandle = {
  show: () => void;
  hide: () => void;
};

interface Props {
  flow: BookingEngineFlow;
  coupon: BookingEngineCoupon;
  onReserve: () => void;
}

const BookingDiscountCodeSheet = forwardRef<BookingDiscountCodeSheetHandle, Props>(
  function BookingDiscountCodeSheet({ flow, coupon, onReserve }, ref) {
    const sheetRef = useRef<ActionSheetRef>(null);
    const { t } = flow;

    useImperativeHandle(ref, () => ({
      show: () => sheetRef.current?.show(),
      hide: () => sheetRef.current?.hide(),
    }));

    const handleClose = () => {
      coupon.dismissDiscountSheet();
    };

    const handleReserve = () => {
      coupon.commitFromDiscountSheet();
      sheetRef.current?.hide();
      onReserve();
    };

    return (
      <ActionSheetThemed
        ref={sheetRef}
        gestureEnabled
        onClose={handleClose}
        containerStyle={{ paddingBottom: 24 }}>
        <View className="px-global pb-2 pt-2">
          <ThemedText className="text-lg font-semibold">{t('bookingDiscountCodeSheetTitle')}</ThemedText>
          <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
            {t('bookingDiscountCodeSheetHint')}
          </ThemedText>

          <View className="mt-4 flex-row items-stretch gap-2">
            <TextInput
              placeholder={t('reservationCouponPlaceholder')}
              placeholderTextColor="#888"
              value={coupon.couponCodeInput}
              onChangeText={coupon.onCouponCodeChange}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!coupon.verifying}
              className="min-h-[44px] flex-1 rounded-xl border border-neutral-400/30 bg-light-secondary px-3 py-2 text-base text-light-text dark:border-neutral-500/40 dark:bg-dark-secondary dark:text-dark-text"
            />
            <AppButton
              title={t('reservationCouponVerify')}
              variant="outline"
              size="sm"
              loading={coupon.verifying}
              disabled={coupon.verifying}
              onPress={() => void coupon.handleVerifyCoupon()}
              className="self-center px-3"
            />
          </View>

          {coupon.previewError ? (
            <ThemedText className="mt-2 text-sm text-red-500 dark:text-red-400">
              {coupon.previewError}
            </ThemedText>
          ) : null}

          {coupon.preview ? (
            <>
              <View className="mt-4">
                <BookingContactSummaryPanel flow={flow} hideCatalogPrice />
              </View>
              <BookingCouponPriceBreakdown preview={coupon.preview} t={t} />
              <AppButton
                title={flow.contact.submitting ? t('reservationCreating') : t('bookingReserveTerm')}
                loading={flow.contact.submitting}
                disabled={flow.contact.submitting}
                onPress={handleReserve}
                className="mt-4"
              />
            </>
          ) : null}
        </View>
      </ActionSheetThemed>
    );
  }
);

export default BookingDiscountCodeSheet;
