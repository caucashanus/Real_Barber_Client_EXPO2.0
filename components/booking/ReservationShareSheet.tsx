import React, { forwardRef, useCallback, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import * as WebBrowser from 'expo-web-browser';

import { useLanguage } from '@/contexts/LanguageContext';
import { useCopyFeedback } from '@/contexts/CopyFeedbackContext';
import { useTranslation } from '@/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import Icon from '@/components/Icon';
import SheetNavRow from '@/components/shared/SheetNavRow';
import ThemedText from '@/components/ThemedText';
import type { RelativeDayLocale } from '@/utils/formatRelativeDayLabel';
import { SHARE_OPEN_DELAY_MS } from '@/utils/profileShareLinks';
import { buildReservationShareUrl, shareReservationUrl } from '@/utils/reservationShareHelpers';

export interface ReservationShareSheetProps {
  bookingId: string;
}

export const ReservationShareSheet = forwardRef<ActionSheetRef, ReservationShareSheetProps>(
  function ReservationShareSheet({ bookingId }, ref) {
    const { t } = useTranslation();
    const { locale } = useLanguage();
    const { copyToClipboard } = useCopyFeedback();
    const innerRef = useRef<ActionSheetRef | null>(null);

    const setRef = useCallback(
      (node: ActionSheetRef | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
      },
      [ref]
    );

    const shareUrl = useMemo(
      () => buildReservationShareUrl(bookingId, locale as RelativeDayLocale),
      [bookingId, locale]
    );

    const hideSheet = () => {
      innerRef.current?.hide();
    };

    const openPublicPreview = () => {
      hideSheet();
      setTimeout(() => {
        void WebBrowser.openBrowserAsync(shareUrl);
      }, SHARE_OPEN_DELAY_MS);
    };

    const handleNativeShare = () => {
      hideSheet();
      setTimeout(() => {
        void shareReservationUrl(shareUrl, copyToClipboard);
      }, SHARE_OPEN_DELAY_MS);
    };

    return (
      <ActionSheetThemed ref={setRef} fitContent gestureEnabled>
        <View className="gap-4 px-4 pb-8 pt-2">
          <ThemedText className="text-base font-semibold">{t('bookingShareSheetTitle')}</ThemedText>

          <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
            {t('bookingShareHowItWorksP1')}
          </ThemedText>
          <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
            {t('bookingShareHowItWorksP2')}
          </ThemedText>

          <AppButton
            variant="choice"
            size="sm"
            title={t('bookingSharePreviewChip')}
            onPress={openPublicPreview}
            className="self-start rounded-lg px-2 py-1"
            textClassName="text-sm font-semibold"
          />

          <View className="gap-1">
            <SheetNavRow
              label={t('bookingShareButton')}
              icon={<Icon name="Share" size={16} strokeWidth={1.5} className="opacity-80" />}
              onPress={handleNativeShare}
            />
          </View>
        </View>
      </ActionSheetThemed>
    );
  }
);
