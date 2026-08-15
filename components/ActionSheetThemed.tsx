import React, { forwardRef } from 'react';
import ActionSheet, { ActionSheetProps, ActionSheetRef } from 'react-native-actions-sheet';

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
          backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.35)' : '#525252',
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
