import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import { getBranchNavigateMapsQuery } from '@/components/BranchNavigateSheet';
import Icon from '@/components/Icon';
import ShowRating from '@/components/ShowRating';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface BranchHeaderInfoProps {
  name: string;
  address?: string | null;
  average: number;
  hasReviewed: boolean;
  reviewParams: string;
  onScrollToReviews: () => void;
  onNavigatePress: () => void;
  t: (key: TranslationKey) => string;
}

export default function BranchHeaderInfo({
  name,
  address,
  average,
  hasReviewed,
  reviewParams,
  onScrollToReviews,
  onNavigatePress,
  t,
}: BranchHeaderInfoProps) {
  const canOpenBranchNavigate = getBranchNavigateMapsQuery(name, address) !== '';

  return (
    <View>
      <View className="mb-2 flex-row items-start justify-between gap-2">
        <ThemedText className="min-w-0 flex-1 shrink pr-1 text-3xl font-semibold">
          {name}
        </ThemedText>
        {canOpenBranchNavigate ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('branchNavigateSectionTitle')}
            onPress={onNavigatePress}
            className="mt-1 h-7 shrink-0 flex-row items-center justify-center gap-0.5 rounded-full bg-light-secondary px-2.5 active:opacity-80 dark:bg-dark-secondary">
            <Icon name="Navigation" size={12} className="text-light-text dark:text-dark-text" />
            <ThemedText className="text-center text-xs font-semibold">
              {t('branchNavigateSectionTitle')}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      <View className="mt-4 flex-row items-center justify-center gap-4">
        <Pressable
          onPress={onScrollToReviews}
          accessibilityRole="button"
          accessibilityLabel={t('profileReviews')}
          className="active:opacity-70">
          <ShowRating rating={average} size="lg" className="py-2" />
        </Pressable>
        <Pressable
          onPress={() => router.push(`/screens/review?${reviewParams}`)}
          className="rounded-lg bg-light-secondary px-3 py-2 dark:bg-dark-secondary">
          <ThemedText className="text-sm font-medium">
            {hasReviewed ? t('branchUpdateReview') : t('branchReview')}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}
