import React from 'react';
import { Pressable, View } from 'react-native';

import useThemeColors from '@/contexts/ThemeColors';
import ThemedText from '@/components/ThemedText';

interface StepProgressIndicatorProps {
  stepCount: number;
  currentStepIndex: number;
  labels?: string[];
  onStepPress?: (stepIndex: number) => void;
  className?: string;
  /** full = pruhy přes celou šířku (booking); compact = krátké segmenty (MultiStep dole) */
  layout?: 'full' | 'compact';
}

export default function StepProgressIndicator({
  stepCount,
  currentStepIndex,
  labels,
  onStepPress,
  className = '',
  layout = 'compact',
}: StepProgressIndicatorProps) {
  const colors = useThemeColors();
  const safeIndex = Math.min(Math.max(0, currentStepIndex), Math.max(0, stepCount - 1));

  if (stepCount <= 0) return null;

  const isFullLayout = layout === 'full';

  return (
    <View className={`gap-2 ${className}`}>
      <View className={`w-full flex-row items-center ${isFullLayout ? 'gap-1' : 'justify-center gap-1.5'}`}>
        {Array.from({ length: stepCount }).map((_, index) => {
          const isCurrent = index === safeIndex;
          const isDone = index < safeIndex;
          const isActive = isDone || isCurrent;
          const clickable = isDone && Boolean(onStepPress);

          const segment = (
            <View
              className={`w-full rounded-full ${isFullLayout ? 'h-2' : 'max-w-[56px] flex-1'}`}
              style={{
                ...(isFullLayout
                  ? {
                      height: 8,
                      backgroundColor: isActive ? colors.highlight : colors.secondary,
                      opacity: isActive ? 1 : 0.45,
                    }
                  : {
                      height: isCurrent ? 8 : 5,
                      backgroundColor: isActive ? colors.highlight : colors.secondary,
                      borderWidth: isCurrent ? 2 : 0,
                      borderColor: colors.highlight,
                      opacity: isActive ? 1 : 0.55,
                    }),
              }}
            />
          );

          if (clickable) {
            return (
              <Pressable
                key={index}
                className="min-w-0 flex-1 active:opacity-80"
                onPress={() => onStepPress?.(index)}
                accessibilityRole="button"
                accessibilityLabel={labels?.[index] ?? `Step ${index + 1}`}>
                {segment}
              </Pressable>
            );
          }

          return (
            <View key={index} className="min-w-0 flex-1">
              {segment}
            </View>
          );
        })}
      </View>

      {labels && labels.length > 0 ? (
        <View className="flex-row">
          {labels.map((label, index) => {
            const isDone = index < safeIndex;
            const isCurrent = index === safeIndex;
            const clickable = isDone && Boolean(onStepPress);

            if (clickable) {
              return (
                <Pressable
                  key={`${label}-${index}`}
                  className="flex-1 px-1 active:opacity-80"
                  onPress={() => onStepPress?.(index)}>
                  <ThemedText
                    className="text-center text-[11px] font-medium"
                    style={{ color: colors.highlight }}
                    numberOfLines={1}>
                    {label}
                  </ThemedText>
                </Pressable>
              );
            }

            return (
              <View key={`${label}-${index}`} className="flex-1 px-1">
                <ThemedText
                  className={`text-center text-[11px] ${
                    isCurrent
                      ? 'font-semibold text-light-text dark:text-dark-text'
                      : 'font-medium text-light-subtext dark:text-dark-subtext'
                  }`}
                  numberOfLines={1}>
                  {label}
                </ThemedText>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
