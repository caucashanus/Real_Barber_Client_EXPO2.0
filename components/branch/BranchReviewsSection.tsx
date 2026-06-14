import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, View, type LayoutChangeEvent } from 'react-native';

import type { EntityReviewItem } from '@/api/reviews';
import useThemeColors from '@/app/contexts/ThemeColors';
import { CardScroller } from '@/components/CardScroller';
import ShowRating from '@/components/ShowRating';
import ThemedText from '@/components/ThemedText';
import EntityReviewCard from '@/components/detail/EntityReviewCard';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

interface BranchReviewsSectionProps {
  reviews: EntityReviewItem[];
  loadingReviews: boolean;
  hasReviewed: boolean;
  reviewParams: string;
  countByRating: Record<number, number>;
  average: number;
  displayTotal: number;
  clientId?: string | number | null;
  locale: string;
  onLayout: (e: LayoutChangeEvent) => void;
  onOpenRatingModal: () => void;
  t: (key: TranslationKey) => string;
}

export default function BranchReviewsSection({
  reviews,
  loadingReviews,
  hasReviewed,
  reviewParams,
  average,
  displayTotal,
  clientId,
  locale,
  onLayout,
  onOpenRatingModal,
  t,
}: BranchReviewsSectionProps) {
  const colors = useThemeColors();

  return (
    <View onLayout={onLayout}>
      <Section className="mb-6">
        <View className="mb-3 mt-4 flex-row items-center justify-between">
          <View>
            <ThemedText className="text-lg font-semibold">{t('profileReviews')}</ThemedText>
            <ThemedText className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext">
              {displayTotal} {t('branchReviews')}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => router.push(`/screens/review?${reviewParams}`)}
            className="rounded-lg bg-light-secondary px-3 py-2 dark:bg-dark-secondary">
            <ThemedText className="text-sm font-medium">
              {hasReviewed ? t('branchUpdateReview') : t('branchWriteReview')}
            </ThemedText>
          </Pressable>
        </View>
        {loadingReviews ? (
          <View className="items-center py-6">
            <ActivityIndicator size="small" />
            <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
              {t('branchLoadingReviews')}
            </ThemedText>
          </View>
        ) : (
          <CardScroller className="mt-1" space={10}>
            {reviews.map((review) => {
              const isOwnReview = clientId != null && review.client?.id === clientId;
              return (
                <EntityReviewCard
                  key={review.id}
                  review={review}
                  locale={locale}
                  isOwnReview={isOwnReview}
                  reviewParams={reviewParams}
                  ownReviewMode="badge"
                  t={t}
                />
              );
            })}
          </CardScroller>
        )}
        <View className="mt-6 flex-row items-center justify-between rounded-lg bg-light-secondary p-4 dark:bg-dark-secondary">
          <View className="flex-row items-center">
            <ShowRating rating={average} size="lg" />
            <ThemedText className="ml-2 text-light-subtext dark:text-dark-subtext">
              ({displayTotal})
            </ThemedText>
          </View>
          <Pressable
            onPress={onOpenRatingModal}
            style={{ backgroundColor: colors.highlight }}
            className="rounded-lg px-3 py-2">
            <ThemedText className="text-sm font-medium text-white">
              {t('branchFullRating')}
            </ThemedText>
          </Pressable>
        </View>
      </Section>
    </View>
  );
}
