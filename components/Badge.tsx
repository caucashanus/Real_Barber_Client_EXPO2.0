import React from 'react';
import { Platform, Text, View, type TextStyle, type ViewStyle } from 'react-native';

export type BadgeVariant = 'default';
export type BadgeTone = 'online' | 'offline';
export type BadgeDotTone = 'green' | 'orange' | 'red';

interface BadgeProps {
  variant?: BadgeVariant;
  tone?: BadgeTone;
  dotTone?: BadgeDotTone;
  children: React.ReactNode;
}

const DESTRUCTIVE = '#DC2626';
const GREEN_400 = '#4ade80';
const ORANGE_400 = '#fb923c';

const DOT_COLOR: Record<BadgeDotTone, string> = {
  green: GREEN_400,
  orange: ORANGE_400,
  red: DESTRUCTIVE,
};

const BADGE_BG = 'rgba(0, 0, 0, 0.55)';
const INNER_RADIUS = 6;
const RING_WIDTH = 1;
const OUTER_RADIUS = INNER_RADIUS + RING_WIDTH;

function badgeRingAndLabel(tone: BadgeTone): { ringColor: string; label: TextStyle } {
  if (tone === 'offline') {
    return {
      ringColor: 'rgba(220, 38, 38, 0.4)',
      label: { color: DESTRUCTIVE },
    };
  }
  return {
    ringColor: 'rgba(34, 197, 94, 0.55)',
    label: { color: GREEN_400 },
  };
}

const innerShellStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  alignSelf: 'flex-start',
  flexGrow: 0,
  flexShrink: 0,
  paddingHorizontal: 8,
  paddingVertical: 2,
  columnGap: 6,
  borderRadius: INNER_RADIUS,
  overflow: 'hidden',
  backgroundColor: BADGE_BG,
};

/** Status / metadata badge — web `Badge` (variant default + tone, ring @ alpha). */
export default function Badge({
  variant: _variant = 'default',
  tone = 'online',
  dotTone = 'green',
  children,
}: BadgeProps) {
  const { ringColor, label } = badgeRingAndLabel(tone);

  const body = (
    <>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: DOT_COLOR[dotTone],
        }}
      />
      <Text
        style={[
          label,
          {
            fontSize: 12,
            fontWeight: '500',
            lineHeight: 16,
            ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
          },
        ]}
        numberOfLines={1}>
        {children}
      </Text>
    </>
  );

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: OUTER_RADIUS,
        padding: RING_WIDTH,
        backgroundColor: ringColor,
      }}>
      <View style={innerShellStyle}>{body}</View>
    </View>
  );
}
