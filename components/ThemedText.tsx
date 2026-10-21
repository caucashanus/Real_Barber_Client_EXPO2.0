// components/ThemedText.tsx
import { styled } from 'nativewind';
import React from 'react';
import { Text, TextProps } from 'react-native';

import {
  sanitizeNativeWindTextClassName,
  sanitizeTextStyleLetterSpacing,
} from '@/utils/sanitizeNativeWindTextClassName';

interface ThemedTextProps extends TextProps {
  children: React.ReactNode;
}

// Wrap the native Text component so we can use className
const StyledText = styled(Text);

export default function ThemedText({ children, className, style, ...props }: ThemedTextProps) {
  const mergedClassName = sanitizeNativeWindTextClassName(
    `text-black dark:text-white ${className || ''}`
  );
  return (
    <StyledText className={mergedClassName} style={sanitizeTextStyleLetterSpacing(style)} {...props}>
      {children}
    </StyledText>
  );
}
