import { Image } from 'expo-image';
import React, { forwardRef, useCallback } from 'react';
import { ScrollView } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import ExpoBottomSheet from '@/components/sheets/ExpoBottomSheet';
import SheetContent, {
  SheetSectionTitle,
  SheetText,
  useSheetLayoutWidth,
  useSheetTextWidth,
} from '@/components/sheets/SheetContent';
import { SHEET_TITLE_CLASS } from '@/components/sheets/expoSheetTheme';
import ThemedText from '@/components/ThemedText';
import {
  DEFAULT_REFERRER_REWARD_RBC,
  REFERRAL_MARKETING_CZK,
  formatReferralRbc,
} from '@/utils/referralDashboardHelpers';
import { interpolateReferralTemplate } from '@/utils/referralShareLinks';

interface ReferralRbcInfoSheetProps {
  rewardRbc: number;
}

export const ReferralRbcInfoSheet = forwardRef<ActionSheetRef, ReferralRbcInfoSheetProps>(
  function ReferralRbcInfoSheet({ rewardRbc }, ref) {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const layoutWidth = useSheetLayoutWidth();
    const titleWidth = useSheetTextWidth();

    const setRef = useCallback(
      (node: ActionSheetRef | null) => {
        if (typeof ref === 'function') ref(node);
        else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
      },
      [ref]
    );

    const rbcLabel = formatReferralRbc(rewardRbc || DEFAULT_REFERRER_REWARD_RBC);
    const logoSource = isDark
      ? require('@/assets/img/wallet/realbarber-dark.png')
      : require('@/assets/img/wallet/realbarber-light.png');

    return (
      <ExpoBottomSheet ref={setRef} snapPoints={['half']}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={{ width: layoutWidth, maxWidth: layoutWidth }}
          contentContainerStyle={{ flexGrow: 1 }}>
          <SheetContent className="gap-1 bg-light-primary px-4 pb-8 pt-2 dark:bg-dark-primary">
            <Image
              source={logoSource}
              style={{ height: 28, width: 32, marginBottom: 4, alignSelf: 'flex-start' }}
              contentFit="contain"
              contentPosition="left center"
              accessibilityLabel="Real Barber"
            />

            <ThemedText className={SHEET_TITLE_CLASS} style={{ width: titleWidth, maxWidth: titleWidth }}>
              {t('referralRbcSheetTitle')}
            </ThemedText>

            <SheetSectionTitle>{t('referralRbcWhatTitle')}</SheetSectionTitle>
            <SheetText>{t('referralRbcWhatBody')}</SheetText>

            <SheetSectionTitle>{t('referralRbcUseTitle')}</SheetSectionTitle>
            <SheetText>{t('referralRbcUseBody')}</SheetText>

            <SheetSectionTitle>{t('referralRbcValueTitle')}</SheetSectionTitle>
            <SheetText>
              {interpolateReferralTemplate(t('referralRbcValueBody'), {
                rbc: rbcLabel,
                czk: String(REFERRAL_MARKETING_CZK),
              })}
            </SheetText>
          </SheetContent>
        </ScrollView>
      </ExpoBottomSheet>
    );
  }
);
