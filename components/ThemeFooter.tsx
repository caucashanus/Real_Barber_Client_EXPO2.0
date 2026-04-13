import { styled } from 'nativewind';
import React from 'react';
import { ScrollView, View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ThemeFooterProps extends ViewProps {
  children: React.ReactNode;
}

const ThemeFooter = styled(View);

export default function ThemedFooter({ children, className, ...props }: ThemeFooterProps) {
  const insets = useSafeAreaInsets();
  return (
    <ThemeFooter
      style={{ paddingBottom: insets.bottom }}
      className={`w-full items-stretch bg-light-primary px-global pt-global dark:bg-dark-primary ${className || ''}`}
      {...props}>
      {children}
    </ThemeFooter>
  );
}
