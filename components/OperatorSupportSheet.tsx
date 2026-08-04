import { router } from 'expo-router';
import React, { forwardRef, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import OperatorContactChannels from '@/components/OperatorContactChannels';
import ThemedText from '@/components/ThemedText';

export type OperatorSupportSheetVariant = 'support' | 'callUs';

export interface OperatorSupportSheetProps {
  /**
   * `support` — FAB / Nápověda (intro + vypnutí v nastavení).
   * `callUs` — „Zavolejte nám“ (detail holiče / pobočky / nearest).
   */
  variant?: OperatorSupportSheetVariant;
}

export const OperatorSupportSheet = forwardRef<ActionSheetRef, OperatorSupportSheetProps>(
  function OperatorSupportSheet({ variant = 'support' }, ref) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const innerRef = useRef<ActionSheetRef | null>(null);

    const setRef = useCallback(
      (node: ActionSheetRef | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
      },
      [ref]
    );

    const hideSheet = () => {
      innerRef.current?.hide();
    };

    const openFeatureSettings = () => {
      hideSheet();
      setTimeout(() => {
        router.push('/screens/feature-settings');
      }, 300);
    };

    const title =
      variant === 'callUs' ? t('operatorCallUsTitle') : t('operatorSheetTitle');

    return (
      <ActionSheetThemed ref={setRef} gestureEnabled>
        <View className="gap-3 px-4 pb-8 pt-2">
          <ThemedText className="mb-1 text-center text-base font-semibold">{title}</ThemedText>

          {variant === 'support' ? (
            <View className="mb-1 gap-1">
              <ThemedText className="text-center text-sm leading-5 text-light-subtext dark:text-dark-subtext">
                {t('operatorSheetIntro')}
              </ThemedText>
              <ThemedText className="text-center text-sm leading-5 text-light-subtext dark:text-dark-subtext">
                {t('operatorSheetDisableBefore')}
                <ThemedText
                  className="text-sm font-medium underline"
                  style={{ color: colors.highlight }}
                  onPress={openFeatureSettings}>
                  {t('operatorSheetDisableLink')}
                </ThemedText>
                .
              </ThemedText>
            </View>
          ) : null}

          <OperatorContactChannels onBeforeOpen={hideSheet} />
        </View>
      </ActionSheetThemed>
    );
  }
);

/** Alias pro nested „Zavolejte nám“ sheet (detail holiče / pobočky / nearest). */
export const OperatorCallUsSheet = forwardRef<ActionSheetRef>(function OperatorCallUsSheet(_, ref) {
  return <OperatorSupportSheet ref={ref} variant="callUs" />;
});
