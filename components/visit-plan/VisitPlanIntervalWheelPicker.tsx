import React, { useCallback, useMemo, useRef } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import ThemedText from '@/components/ThemedText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAccentColor } from '@/contexts/AccentColorContext';
import {
  clampVisitPlanIntervalDays,
  formatVisitPlanIntervalUnit,
  visitPlanIntervalWheelLabels,
  VISIT_PLAN_INTERVAL_MAX_DAYS,
  VISIT_PLAN_INTERVAL_MIN_DAYS,
} from '@/utils/visitPlanIntervalDisplay';

const CX = 100;
const CY = 100;
const TRACK_R = 78;
const TRACK_STROKE = 10;
const KNOB_R = 7;

function daysToFraction(days: number, min: number, max: number): number {
  if (max <= min) return 0;
  return (clampVisitPlanIntervalDays(days) - min) / (max - min);
}

function fractionToDays(fraction: number, min: number, max: number): number {
  const clamped = Math.min(1, Math.max(0, fraction));
  return clampVisitPlanIntervalDays(min + clamped * (max - min));
}

function daysToAngleDeg(days: number, min: number, max: number): number {
  return -90 + daysToFraction(days, min, max) * 360;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function pointToDays(localX: number, localY: number, size: number, min: number, max: number): number {
  const x = (localX / size) * 200;
  const y = (localY / size) * 200;
  const dx = x - CX;
  const dy = y - CY;
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  deg = (deg + 90 + 360) % 360;
  return fractionToDays(deg / 360, min, max);
}

type Props = {
  days: number;
  onDaysChange: (days: number) => void;
  min?: number;
  max?: number;
  size?: 'default' | 'lg';
};

export default function VisitPlanIntervalWheelPicker({
  days,
  onDaysChange,
  min = VISIT_PLAN_INTERVAL_MIN_DAYS,
  max = VISIT_PLAN_INTERVAL_MAX_DAYS,
  size = 'default',
}: Props) {
  const { locale } = useLanguage();
  const { accentColor } = useAccentColor();
  const dialSize = size === 'lg' ? 320 : 260;
  const layoutSize = useRef(dialSize);
  const value = clampVisitPlanIntervalDays(days);
  const labels = visitPlanIntervalWheelLabels(value);
  const circumference = 2 * Math.PI * TRACK_R;
  const progress = daysToFraction(value, min, max) * circumference;
  const knob = polar(CX, CY, TRACK_R, daysToAngleDeg(value, min, max));

  const onLayout = (e: LayoutChangeEvent) => {
    layoutSize.current = e.nativeEvent.layout.width;
  };

  const applyAt = useCallback(
    (x: number, y: number) => {
      onDaysChange(pointToDays(x, y, layoutSize.current, min, max));
    },
    [max, min, onDaysChange]
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .shouldCancelWhenOutside(false)
        .onBegin((e) => {
          runOnJS(applyAt)(e.x, e.y);
        })
        .onUpdate((e) => {
          runOnJS(applyAt)(e.x, e.y);
        }),
    [applyAt]
  );

  const primaryClass = size === 'lg' ? 'text-7xl' : 'text-5xl';

  return (
    <View className="items-center">
      <GestureDetector gesture={pan}>
        <View
          onLayout={onLayout}
          style={{ width: dialSize, height: dialSize }}
          className="items-center justify-center"
          accessibilityRole="adjustable">
          <Svg
            width={dialSize}
            height={dialSize}
            viewBox="0 0 200 200"
            pointerEvents="none">
            <Circle
              cx={CX}
              cy={CY}
              r={TRACK_R}
              stroke="#9CA3AF"
              strokeWidth={TRACK_STROKE}
              fill="none"
            />
            <Circle
              cx={CX}
              cy={CY}
              r={TRACK_R}
              stroke={accentColor}
              strokeWidth={TRACK_STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`}
              transform={`rotate(-90 ${CX} ${CY})`}
            />
            <Circle cx={knob.x} cy={knob.y} r={KNOB_R} fill="#111827" />
          </Svg>
          <View className="pointer-events-none absolute inset-0 items-center justify-center pt-2">
            <ThemedText className={`font-bold tabular-nums ${primaryClass}`}>{labels.primary}</ThemedText>
            <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
              {formatVisitPlanIntervalUnit(locale, value)}
            </ThemedText>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}
