import React from 'react';
import type { TextProps } from 'react-native';

import ThemedText from '@/components/ThemedText';

interface MediaCardTitleProps extends TextProps {
  children: React.ReactNode;
  className?: string;
}

/** Globální H2 pod media kartou (20 px, max 2 řádky). */
export default function MediaCardTitle({
  children,
  className = '',
  ...props
}: MediaCardTitleProps) {
  return (
    <ThemedText
      accessibilityRole="header"
      numberOfLines={2}
      className={`text-xl font-semibold leading-snug text-light-text dark:text-dark-text ${className}`.trim()}
      {...props}>
      {children}
    </ThemedText>
  );
}
