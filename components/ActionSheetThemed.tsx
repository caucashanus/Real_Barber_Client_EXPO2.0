import React, { forwardRef } from 'react';
import ActionSheet, { ActionSheetProps, ActionSheetRef } from 'react-native-actions-sheet';

import { getSheetHandleIndicatorColor } from '@/components/layout/SurfaceCard';
import useThemeColors from '@/contexts/ThemeColors';

interface ActionSheetThemedProps extends ActionSheetProps {}

const ActionSheetThemed = forwardRef<ActionSheetRef, ActionSheetThemedProps>(
  ({ containerStyle, indicatorStyle, ...props }, ref) => {
    const colors = useThemeColors();

    return (
      <ActionSheet
        {...props}
        ref={ref}
        indicatorStyle={{
          backgroundColor: getSheetHandleIndicatorColor(colors.isDark),
          ...indicatorStyle,
        }}
        containerStyle={{
          backgroundColor: colors.sheet,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          ...containerStyle,
        }}
      />
    );
  }
);

export default ActionSheetThemed;
