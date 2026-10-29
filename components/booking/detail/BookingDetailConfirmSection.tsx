import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import type { Booking } from '@/api/bookings';
import AppButton from '@/components/AppButton';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';
import type { TranslationKey } from '@/locales';
import { resolveClientBookingSpotlightPresentation } from '@/utils/clientBookingSpotlightPresentation';
import { bookingManageMessage } from '@/utils/bookingManage';

const NOW_TICK_MS = 15_000;

type Props = {
  booking: Booking;
  confirming: boolean;
  confirmError: string | null;
  onConfirm: () => void;
  t: (key: TranslationKey) => string;
};

export default function BookingDetailConfirmSection({
  booking,
  confirming,
  confirmError,
  onConfirm,
  t,
}: Props) {
  const { isDark } = useThemeColors();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const confirmIconColor = isDark ? '#000000' : '#FFFFFF';

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), NOW_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const presentation = resolveClientBookingSpotlightPresentation(booking, nowMs);
  const canConfirm = presentation.actions.confirm;
  const manageMessage = canConfirm ? bookingManageMessage(booking) : null;

  if (!canConfirm && !manageMessage && !confirmError) return null;

  return (
    <View className="mb-4 gap-3">
      {manageMessage ? (
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {manageMessage}
        </ThemedText>
      ) : null}
      {canConfirm ? (
        <AppButton
          variant="secondary"
          size="lg"
          rounded="md"
          fullWidth
          loading={confirming}
          disabled={confirming}
          className="h-11 min-h-[44px] border-0 bg-black py-0 active:opacity-90 dark:bg-white"
          textClassName="text-sm font-bold text-white dark:text-black"
          onPress={onConfirm}>
          <View className="flex-row items-center justify-center gap-2">
            {!confirming ? (
              <Icon name="CalendarCheck" size={16} color={confirmIconColor} strokeWidth={2} />
            ) : null}
            <ThemedText className="text-sm font-bold text-white dark:text-black">
              {confirming ? t('bookingDetailConfirmSaving') : t('bookingDetailConfirmCta')}
            </ThemedText>
          </View>
        </AppButton>
      ) : null}
      {canConfirm && confirmError ? (
        <View className="rounded-md bg-amber-100 px-3 py-3 dark:bg-amber-950/40">
          <ThemedText className="text-sm text-amber-900 dark:text-amber-100">{confirmError}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}
