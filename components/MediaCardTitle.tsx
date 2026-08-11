import React from 'react';
import type { TextProps } from 'react-native';

import ThemedText from '@/components/ThemedText';

interface MediaCardTitleProps extends TextProps {
  children: React.ReactNode;
  className?: string;
}

/** Globální titulek pod media kartou — stejná velikost jako jméno holiče na webu (16 px). */
export default function MediaCardTitle({
  children,
  className = '',
  ...props
}: MediaCardTitleProps) {
  return (
    <ThemedText
      accessibilityRole="header"
      numberOfLines={2}
      className={`min-w-0 shrink text-base font-semibold leading-5 text-light-text dark:text-dark-text ${className}`.trim()}
      {...props}>
      {children}
    </ThemedText>
  );
}
