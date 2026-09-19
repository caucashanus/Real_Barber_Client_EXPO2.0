import React from 'react';
import { LayoutChangeEvent, useWindowDimensions, View, type ViewStyle } from 'react-native';

import ThemedText from '@/components/ThemedText';

export const SHEET_HORIZONTAL_PADDING = 16;

export const SHEET_BODY_CLASS =
  'w-full gap-1 self-stretch bg-light-primary px-4 pb-8 pt-2 dark:bg-dark-primary';

/** Odstavce v Expo bottom sheetu — nutná explicitní šířka kvůli RNHostView. */
export const SHEET_BODY_TEXT_CLASS =
  'text-sm leading-5 text-light-subtext dark:text-dark-subtext';

export const SHEET_SECTION_TITLE_CLASS = 'mt-3 text-sm font-semibold leading-5';

export function useSheetLayoutWidth(): number {
  const { width } = useWindowDimensions();
  return width;
}

export function useSheetTextWidth(): number {
  const { width } = useWindowDimensions();
  return width - SHEET_HORIZONTAL_PADDING * 2;
}

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  onLayout?: (event: LayoutChangeEvent) => void;
}

/** Standardní padding obsahu bottom sheetu. */
export default function SheetContent({
  children,
  className = SHEET_BODY_CLASS,
  style,
  onLayout,
}: SheetContentProps) {
  const layoutWidth = useSheetLayoutWidth();

  return (
    <View
      className={className}
      style={[{ width: layoutWidth, maxWidth: layoutWidth }, style]}
      onLayout={onLayout}>
      {children}
    </View>
  );
}

interface SheetTextProps {
  children: React.ReactNode;
  className?: string;
}

/** Text v Expo bottom sheetu — šířka podle viewportu, ne intrinsic layout. */
export function SheetText({ children, className = SHEET_BODY_TEXT_CLASS }: SheetTextProps) {
  const textWidth = useSheetTextWidth();

  return (
    <ThemedText className={className} style={{ width: textWidth, maxWidth: textWidth }}>
      {children}
    </ThemedText>
  );
}

/** Nadpis sekce v Expo bottom sheetu. */
export function SheetSectionTitle({
  children,
  className = SHEET_SECTION_TITLE_CLASS,
}: SheetTextProps) {
  const textWidth = useSheetTextWidth();

  return (
    <ThemedText className={className} style={{ width: textWidth, maxWidth: textWidth }}>
      {children}
    </ThemedText>
  );
}
