import { BottomSheet, Host, RNHostView } from '@expo/ui';
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { createExpoSheetModifiers } from '@/components/sheets/expoBottomSheetModifiers';
import { createActionSheetRefBridge } from '@/components/sheets/actionSheetRefBridge';
import { SHEET_SURFACE_CLASS } from '@/components/sheets/expoSheetTheme';
import useThemeColors from '@/contexts/ThemeColors';

/** @see https://docs.expo.dev/versions/v56.0.0/sdk/ui/universal/bottomsheet/ */
export type ExpoBottomSheetSnapPoint =
  | 'half'
  | 'full'
  | { fraction: number }
  | { height: number };

export interface ExpoBottomSheetProps {
  children: React.ReactNode;
  /** Po zavření (swipe / backdrop / ref.hide()). */
  onClose?: () => void;
  /** Před otevřením (ref.show()). */
  onShow?: () => void;
  /**
   * Bez snapPoints = auto výška podle obsahu.
   * `['full']` = velký drawer (nearest branch, waitlist).
   */
  snapPoints?: ExpoBottomSheetSnapPoint[];
  showDragIndicator?: boolean;
}

/**
 * Jediný sdílený bottom sheet — Expo UI + app barvy (`#ffffff` / `#0F0F0F`).
 * Obsah = `children` (React Native komponenty v RNHostView).
 *
 * Nested sheet: vložit jako potomek uvnitř obsahu parent sheetu (iOS stacking).
 */
export const ExpoBottomSheet = forwardRef<ActionSheetRef, ExpoBottomSheetProps>(
  function ExpoBottomSheet({ children, onClose, onShow, snapPoints, showDragIndicator }, ref) {
    const { sheet: sheetBackgroundColor } = useThemeColors();
    const [isPresented, setIsPresented] = useState(false);
    const sheetModifiers = useMemo(
      () => createExpoSheetModifiers(sheetBackgroundColor),
      [sheetBackgroundColor]
    );

    const dismiss = useCallback(() => {
      setIsPresented(false);
      onClose?.();
    }, [onClose]);

    const show = useCallback(() => {
      onShow?.();
      setIsPresented(true);
    }, [onShow]);

    useImperativeHandle(
      ref,
      () =>
        createActionSheetRefBridge(
          show,
          () => setIsPresented(false),
          () => isPresented
        ),
      [isPresented, show]
    );

    const isScrollableSheet = snapPoints != null && snapPoints.length > 0;
    const sheetBody = <View className={SHEET_SURFACE_CLASS}>{children}</View>;

    return (
      <Host matchContents>
        <BottomSheet
          isPresented={isPresented}
          onDismiss={dismiss}
          snapPoints={snapPoints}
          showDragIndicator={showDragIndicator}
          modifiers={sheetModifiers}>
          {isScrollableSheet ? (
            <RNHostView>{sheetBody}</RNHostView>
          ) : (
            <RNHostView matchContents>{sheetBody}</RNHostView>
          )}
        </BottomSheet>
      </Host>
    );
  }
);

export default ExpoBottomSheet;
