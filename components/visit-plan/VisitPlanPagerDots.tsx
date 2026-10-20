import React from 'react';
import { Pressable, View } from 'react-native';

import { useAccentColor } from '@/contexts/AccentColorContext';
import useThemeColors from '@/contexts/ThemeColors';
import {
  VISIT_PLAN_PAGER_DOT_ACTIVE_WIDTH,
  VISIT_PLAN_PAGER_DOT_GAP,
  VISIT_PLAN_PAGER_DOT_HEIGHT,
  VISIT_PLAN_PAGER_DOT_INACTIVE_WIDTH,
} from '@/components/visit-plan/visitPlanPagerDotMetrics';

export type VisitPlanPagerDotsVariant = 'onPhoto' | 'onSurface';

type Props = {
  count: number;
  activeIndex: number;
  variant?: VisitPlanPagerDotsVariant;
  onPressIndex?: (index: number) => void;
  listAccessibilityLabel?: string;
  getDotAccessibilityLabel?: (index: number, total: number) => string;
};

function PagerDot({
  active,
  variant,
}: {
  active: boolean;
  variant: VisitPlanPagerDotsVariant;
}) {
  const { accentColor } = useAccentColor();
  const colors = useThemeColors();
  const width = active ? VISIT_PLAN_PAGER_DOT_ACTIVE_WIDTH : VISIT_PLAN_PAGER_DOT_INACTIVE_WIDTH;

  let backgroundColor: string;
  if (variant === 'onPhoto') {
    backgroundColor = active ? '#FFFFFF' : 'rgba(255,255,255,0.4)';
  } else if (active) {
    backgroundColor = accentColor;
  } else {
    // Light: secondary (#F1F1F1) blends into white screen bg — use visible muted gray.
    backgroundColor = colors.isDark ? colors.secondary : colors.switch;
  }

  return (
    <View
      style={{
        width,
        height: VISIT_PLAN_PAGER_DOT_HEIGHT,
        borderRadius: VISIT_PLAN_PAGER_DOT_HEIGHT / 2,
        backgroundColor,
      }}
    />
  );
}

export default function VisitPlanPagerDots({
  count,
  activeIndex,
  variant = 'onSurface',
  onPressIndex,
  listAccessibilityLabel,
  getDotAccessibilityLabel,
}: Props) {
  if (count <= 1) return null;

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="tablist"
      accessibilityLabel={listAccessibilityLabel}
      testID="visit-plan-pager-dots">
      {Array.from({ length: count }, (_, i) => {
        const active = i === activeIndex;
        const dot = <PagerDot active={active} variant={variant} />;
        const aria = getDotAccessibilityLabel?.(i + 1, count);
        const spacing = i === 0 ? undefined : { marginLeft: VISIT_PLAN_PAGER_DOT_GAP };

        if (onPressIndex) {
          return (
            <Pressable
              key={i}
              style={spacing}
              onPress={() => onPressIndex(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={aria}
              hitSlop={8}>
              {dot}
            </Pressable>
          );
        }

        return (
          <View
            key={i}
            style={spacing}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={aria}>
            {dot}
          </View>
        );
      })}
    </View>
  );
}
