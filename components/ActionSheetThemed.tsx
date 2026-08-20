import React, { forwardRef, useCallback, useState } from 'react';
import { View } from 'react-native';
import ActionSheet, { ActionSheetProps, ActionSheetRef } from 'react-native-actions-sheet';

import { getSheetHandleIndicatorColor } from '@/components/layout/SurfaceCard';
import useThemeColors from '@/contexts/ThemeColors';

/** Výška drag handle (indicator + margin) v kompaktním sheetu. */
const COMPACT_SHEET_HANDLE_HEIGHT = 16;
/** Odhad obsahu před prvním layoutem — zabrání fullscreen flashi u malých sheetů. */
const COMPACT_SHEET_FALLBACK_CONTENT_HEIGHT = 252;

interface ActionSheetThemedProps extends ActionSheetProps {
  /** Sheet se přizpůsobí obsahu (navigace, menu, call-us). */
  fitContent?: boolean;
}

const ActionSheetThemed = forwardRef<ActionSheetRef, ActionSheetThemedProps>(
  ({ containerStyle, indicatorStyle, fitContent = false, overdrawEnabled, children, ...props }, ref) => {
    const colors = useThemeColors();
    const [contentHeight, setContentHeight] = useState<number | null>(null);

    const onFitContentLayout = useCallback(
      (height: number) => {
        const next = Math.ceil(height);
        setContentHeight((prev) => (prev === next ? prev : next));
      },
      []
    );

    const resolvedHeight = fitContent
      ? (contentHeight ?? COMPACT_SHEET_FALLBACK_CONTENT_HEIGHT) + COMPACT_SHEET_HANDLE_HEIGHT
      : undefined;

    return (
      <ActionSheet
        {...props}
        ref={ref}
        overdrawEnabled={fitContent ? false : overdrawEnabled}
        indicatorStyle={{
          backgroundColor: getSheetHandleIndicatorColor(colors.isDark),
          ...indicatorStyle,
        }}
        containerStyle={{
          backgroundColor: colors.sheet,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          ...(resolvedHeight != null ? { height: resolvedHeight } : null),
          ...containerStyle,
        }}>
        {fitContent ? (
          <View
            onLayout={(event) => {
              onFitContentLayout(event.nativeEvent.layout.height);
            }}>
            {children}
          </View>
        ) : (
          children
        )}
      </ActionSheet>
    );
  }
);

export default ActionSheetThemed;
