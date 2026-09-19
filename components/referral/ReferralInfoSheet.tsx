import { Image } from 'expo-image';
import React, { forwardRef, useCallback } from 'react';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import ExpoBottomSheet from '@/components/sheets/ExpoBottomSheet';
import SheetContent, { SheetText, useSheetTextWidth } from '@/components/sheets/SheetContent';
import { SHEET_TITLE_CLASS } from '@/components/sheets/expoSheetTheme';
import ThemedText from '@/components/ThemedText';
import { interpolateReferralTemplate } from '@/utils/referralShareLinks';

export type ReferralInfoSheetKind = 'deadline' | 'ineligible';

interface ReferralInfoSheetProps {
  kind: ReferralInfoSheetKind;
  ttlDays: number;
}

export const ReferralInfoSheet = forwardRef<ActionSheetRef, ReferralInfoSheetProps>(
  function ReferralInfoSheet({ kind, ttlDays }, ref) {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const titleWidth = useSheetTextWidth();

    const setRef = useCallback(
      (node: ActionSheetRef | null) => {
        if (typeof ref === 'function') ref(node);
        else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
      },
      [ref]
    );

    const logoSource = isDark
      ? require('@/assets/img/wallet/realbarber-dark.png')
      : require('@/assets/img/wallet/realbarber-light.png');

    const title =
      kind === 'deadline' ? t('referralInfoDeadlineTitle') : t('referralInfoIneligibleTitle');
    const body =
      kind === 'deadline'
        ? interpolateReferralTemplate(t('referralInfoDeadlineBody'), { days: ttlDays })
        : t('referralInfoIneligibleBody');

    return (
      <ExpoBottomSheet ref={setRef}>
        <SheetContent>
          <Image
            source={logoSource}
            style={{ height: 28, width: 32, marginBottom: 4, alignSelf: 'flex-start' }}
            contentFit="contain"
            contentPosition="left center"
            accessibilityLabel="Real Barber"
          />

          <ThemedText className={SHEET_TITLE_CLASS} style={{ width: titleWidth, maxWidth: titleWidth }}>
            {title}
          </ThemedText>

          <SheetText className="mt-2 text-sm leading-5 text-light-subtext dark:text-dark-subtext">
            {body}
          </SheetText>
        </SheetContent>
      </ExpoBottomSheet>
    );
  }
);
