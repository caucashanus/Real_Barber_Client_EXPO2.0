import React from 'react';
import { Pressable } from 'react-native';

interface BranchChannelIconButtonProps {
  label: string;
  onPress: () => void;
  bgClassName: string;
  children: React.ReactNode;
}

export default function BranchChannelIconButton({
  label,
  onPress,
  bgClassName,
  children,
}: BranchChannelIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`h-8 w-8 shrink-0 items-center justify-center rounded-full active:opacity-70 ${bgClassName}`}>
      {children}
    </Pressable>
  );
}
