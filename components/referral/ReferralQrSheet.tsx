import React, { forwardRef, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import QRCode from 'react-native-qrcode-svg';

import { useTranslation } from '@/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import ShareUrlCopyRow from '@/components/shared/ShareUrlCopyRow';
import ThemedText from '@/components/ThemedText';

interface ReferralQrSheetProps {
  shareUrl: string;
}

export const ReferralQrSheet = forwardRef<ActionSheetRef, ReferralQrSheetProps>(
  function ReferralQrSheet({ shareUrl }, ref) {
    const { t } = useTranslation();
    const innerRef = useRef<ActionSheetRef | null>(null);

    const setRef = useCallback(
      (node: ActionSheetRef | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
      },
      [ref]
    );

    return (
      <ActionSheetThemed ref={setRef} fitContent gestureEnabled>
        <View className="items-center px-4 pb-8 pt-2">
          <ThemedText className="mb-4 text-center text-sm text-light-subtext dark:text-dark-subtext">
            {t('referralQrLead')}
          </ThemedText>
          <View className="rounded-2xl bg-white p-4">
            <QRCode value={shareUrl} size={240} />
          </View>
          <ShareUrlCopyRow
            className="mt-4 w-full"
            shareUrl={shareUrl}
            copyAccessibilityLabel={t('barberShareCopyLink')}
          />
        </View>
      </ActionSheetThemed>
    );
  }
);
