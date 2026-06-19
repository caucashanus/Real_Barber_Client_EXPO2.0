import { styled } from 'nativewind';
import React from 'react';
import { Text, TextProps } from 'react-native';

import {
  typographyVariantClass,
  type TypographyVariant,
} from '@/constants/typography';

interface ThemedTextProps extends TextProps {
  children: React.ReactNode;
  /** Brand typography preset — defaults to body (Archivo Regular 15px) */
  variant?: TypographyVariant;
}

const StyledText = styled(Text);

export default function ThemedText({
  children,
  className,
  variant = 'body',
  ...props
}: ThemedTextProps) {
  return (
    <StyledText
      className={`text-light-text dark:text-dark-text ${typographyVariantClass[variant]} ${className || ''}`}
      {...props}>
      {children}
    </StyledText>
  );
}
