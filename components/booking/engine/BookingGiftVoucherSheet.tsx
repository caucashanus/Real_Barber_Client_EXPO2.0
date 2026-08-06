import { Image } from 'expo-image';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

export type BookingGiftVoucherSheetHandle = {
  show: () => void;
  hide: () => void;
};

interface Props {
  t: (key: TranslationKey) => string;
}

const BookingGiftVoucherSheet = forwardRef<BookingGiftVoucherSheetHandle, Props>(
  function BookingGiftVoucherSheet({ t }, ref) {
    const sheetRef = useRef<ActionSheetRef>(null);

    useImperativeHandle(ref, () => ({
      show: () => sheetRef.current?.show(),
      hide: () => sheetRef.current?.hide(),
    }));

    return (
      <ActionSheetThemed ref={sheetRef} gestureEnabled containerStyle={{ paddingBottom: 24 }}>
        <View className="items-center px-global pb-2 pt-2">
          <Image
            source={require('@/assets/img/booking-gift-card.png')}
            className="mb-4 w-full max-w-[320px] rounded-2xl"
            style={{ aspectRatio: 1.6 }}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
          <ThemedText className="text-center text-lg font-semibold">
            {t('bookingGiftVoucherSheetTitle')}
          </ThemedText>
          <ThemedText className="mt-3 text-center text-sm leading-6 text-light-subtext dark:text-dark-subtext">
            {t('bookingGiftVoucherSheetBody')}
          </ThemedText>
          <AppButton
            title={t('bookingGiftVoucherContinue')}
            onPress={() => sheetRef.current?.hide()}
            className="mt-6 w-full"
          />
        </View>
      </ActionSheetThemed>
    );
  }
);

export default BookingGiftVoucherSheet;
