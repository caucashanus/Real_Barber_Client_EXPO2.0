import React from 'react';
import { View } from 'react-native';

import ShowRating from '@/components/ShowRating';
import ThemedText from '@/components/ThemedText';

interface RatingBreakdownPanelProps {
  countByRating: Record<number, number>;
  average: number;
  displayTotal: number;
  reviewsLabel: string;
  variant?: 'inline' | 'modal';
  showHeader?: boolean;
}

export default function RatingBreakdownPanel({
  countByRating,
  average,
  displayTotal,
  reviewsLabel,
  variant = 'inline',
  showHeader = true,
}: RatingBreakdownPanelProps) {
  const rowClassName =
    variant === 'modal'
      ? 'flex-row items-center justify-between border-b border-neutral-200 py-3 dark:border-dark-secondary'
      : 'flex-row items-center justify-between py-1.5';

  const content = (
    <View className="space-y-2">
      {([5, 4, 3, 2, 1] as const).map((stars) => (
        <View key={stars} className={rowClassName}>
          <ShowRating rating={stars} size="sm" displayMode="stars" />
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {countByRating[stars] ?? 0} {reviewsLabel}
          </ThemedText>
        </View>
      ))}
    </View>
  );

  if (variant === 'modal') {
    return content;
  }

  return (
    <View className="rounded-lg bg-light-secondary p-4 dark:bg-dark-secondary">
      {showHeader ? (
        <View className="mb-4 flex-row items-center">
          <ShowRating rating={average} size="lg" />
          <ThemedText className="ml-2 text-light-subtext dark:text-dark-subtext">
            ({displayTotal})
          </ThemedText>
        </View>
      ) : null}
      {content}
    </View>
  );
}
