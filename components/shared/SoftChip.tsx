import React from 'react';
import { Text, View } from 'react-native';
import { styled } from 'nativewind';

import Icon, { type IconName } from '@/components/Icon';
import { SOFT_CHIP_LAYOUT } from '@/constants/buttonTokens';
import { getSoftChipClasses } from '@/constants/buttonVariants';
import { useAccentColor } from '@/contexts/AccentColorContext';

const ChipText = styled(Text);

interface SoftChipProps {
  title: string;
  icon?: IconName | null;
  className?: string;
  textClassName?: string;
}

/** Non-interactive soft brand chip — web `softChipClassName()`. */
export default function SoftChip({
  title,
  icon = 'Sparkles',
  className,
  textClassName,
}: SoftChipProps) {
  const { accentColor } = useAccentColor();
  const { container, text, containerStyle, textStyle } = getSoftChipClasses(
    accentColor,
    className,
    textClassName
  );
  const iconColor = typeof textStyle.color === 'string' ? textStyle.color : undefined;

  return (
    <View className={container} style={containerStyle}>
      <View className={SOFT_CHIP_LAYOUT.content}>
        {icon ? (
          <Icon
            name={icon}
            size={SOFT_CHIP_LAYOUT.iconSize}
            strokeWidth={SOFT_CHIP_LAYOUT.iconStrokeWidth}
            color={iconColor}
          />
        ) : null}
        <ChipText className={text} style={textStyle} numberOfLines={1}>
          {title}
        </ChipText>
      </View>
    </View>
  );
}
