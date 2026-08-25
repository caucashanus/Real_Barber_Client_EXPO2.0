import React from 'react';
import { LayoutChangeEvent, View } from 'react-native';

export const SHEET_BODY_CLASS =
  'gap-1 bg-light-primary px-4 pb-8 pt-2 dark:bg-dark-primary';

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
  onLayout?: (event: LayoutChangeEvent) => void;
}

/** Standardní padding obsahu bottom sheetu. */
export default function SheetContent({
  children,
  className = SHEET_BODY_CLASS,
  onLayout,
}: SheetContentProps) {
  return (
    <View className={className} onLayout={onLayout}>
      {children}
    </View>
  );
}
