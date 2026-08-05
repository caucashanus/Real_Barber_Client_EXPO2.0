import { router } from 'expo-router';
import React, { forwardRef, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import BranchOpenStatusRow from '@/components/branch/BranchOpenStatusRow';
import OperatorContactChannels from '@/components/OperatorContactChannels';
import ThemedText from '@/components/ThemedText';

export type OperatorSupportSheetVariant = 'support' | 'callUs';

const NESTED_SHEET_Z_INDEX = 10000;
const CALL_US_SHEET_ELEVATION = 24;

export interface OperatorSupportSheetProps {
  /**
   * `support` — FAB / Nápověda (intro + vypnutí v nastavení).
   * `callUs` — „Zavolejte nám“ (detail holiče / pobočky / nearest).
   */
  variant?: OperatorSupportSheetVariant;
  /** Render inside another action sheet (non-modal overlay above parent). */
  nested?: boolean;
  /** Status badge nad kontakty (standalone); v nearest draweru vypnuto. */
  showBranchOpenStatus?: boolean;
}

export const OperatorSupportSheet = forwardRef<ActionSheetRef, OperatorSupportSheetProps>(
  function OperatorSupportSheet(
    { variant = 'support', nested = false, showBranchOpenStatus = false },
    ref
  ) {
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

    const isCallUs = variant === 'callUs';

    return (
      <ActionSheetThemed
        ref={setRef}
        gestureEnabled
        isModal={!nested}
        zIndex={nested ? NESTED_SHEET_Z_INDEX : undefined}
        elevation={isCallUs && nested ? CALL_US_SHEET_ELEVATION : undefined}
        defaultOverlayOpacity={isCallUs && nested ? 0.45 : undefined}>
        <View className={isCallUs ? 'gap-1 px-4 pb-8 pt-2' : 'gap-3 px-4 pb-8 pt-2'}>
          <ThemedText
            className={
              isCallUs ? 'mb-2 text-base font-semibold leading-6' : 'mb-1 text-base font-semibold'
            }>
            {title}
          </ThemedText>

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

          {isCallUs && showBranchOpenStatus ? (
            <View className="mb-1">
              <BranchOpenStatusRow t={t} />
            </View>
          ) : null}

          <OperatorContactChannels onBeforeOpen={hideSheet} />
        </View>
      </ActionSheetThemed>
    );
  }
);

/** Alias pro nested „Zavolejte nám“ sheet (detail holiče / pobočky / nearest). */
export const OperatorCallUsSheet = forwardRef<
  ActionSheetRef,
  { nested?: boolean; showBranchOpenStatus?: boolean }
>(function OperatorCallUsSheet({ nested, showBranchOpenStatus }, ref) {
  return (
    <OperatorSupportSheet
      ref={ref}
      variant="callUs"
      nested={nested}
      showBranchOpenStatus={showBranchOpenStatus}
    />
  );
});
