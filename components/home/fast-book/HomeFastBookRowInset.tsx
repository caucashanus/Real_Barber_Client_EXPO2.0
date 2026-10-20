import React from 'react';
import { View, type ViewProps } from 'react-native';

import { HOME_FAST_BOOK_ROW_INSET_PX } from '@/components/home/fast-book/homeFastBookSheetUi';

type Props = ViewProps & {
  className?: string;
};

/** Stejný inset jako služby (px-3) — style kvůli RN/Pressable + flex-row. */
export default function HomeFastBookRowInset({ className, style, children, ...rest }: Props) {
  return (
    <View
      {...rest}
      className={className}
      style={[{ paddingHorizontal: HOME_FAST_BOOK_ROW_INSET_PX }, style]}>
      {children}
    </View>
  );
}
