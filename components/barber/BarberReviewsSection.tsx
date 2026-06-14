import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, View, type LayoutChangeEvent } from 'react-native';

import type { EntityReviewItem } from '@/api/reviews';
import { CardScroller } from '@/components/CardScroller';
import ThemedText from '@/components/ThemedText';
import EntityReviewCard from '@/components/detail/EntityReviewCard';
import RatingBreakdownPanel from '@/components/detail/RatingBreakdownPanel';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

interface BarberReviewsSectionProps {
  reviews: EntityReviewItem[];
  reviewsTotal: number | null;
  loadingReviews: boolean;
  hasReviewed: boolean;
  ownReviewIds: Set<string>;
  reviewParams: string;
  countByRating: Record<number, number>;
  average: number;
  displayTotal: number;
  locale: string;
  onLayout: (e: LayoutChangeEvent) => void;
  t: (key: TranslationKey) => string;
}

export default function BarberReviewsSection({
  reviews,
  loadingReviews,
  hasReviewed,
  ownReviewIds,
  reviewParams,
  countByRating,
  average,
  displayTotal,
  locale,
  onLayout,
  t,
}: BarberReviewsSectionProps) {
  return (
    <View onLayout={onLayout}>
      <Section
        title={t('profileReviews')}
        titleSize="lg"
        subtitle={`${displayTotal} ${t('branchReviews')}`}
        className="mb-6">
        <View className="mt-4">
          <RatingBreakdownPanel
            countByRating={countByRating}
            average={average}
            displayTotal={displayTotal}
            reviewsLabel={t('branchReviews')}
          />
        </View>
        <View className="mb-3 mt-6 flex-row items-center justify-between">
          <ThemedText className="text-lg font-semibold">{t('profileReviews')}</ThemedText>
          {!hasReviewed ? (
            <Pressable
              onPress={() => router.push(`/screens/review?${reviewParams}` as any)}
              className="rounded-lg bg-light-secondary px-3 py-2 dark:bg-dark-secondary">
              <ThemedText className="text-sm font-medium">{t('barberWriteReview')}</ThemedText>
            </Pressable>
          ) : null}
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
            {reviews.map((review) => (
              <EntityReviewCard
                key={review.id}
                review={review}
                locale={locale}
                isOwnReview={ownReviewIds.has(review.id)}
                reviewParams={reviewParams}
                ownReviewMode="edit"
                t={t}
              />
            ))}
          </CardScroller>
        )}
      </Section>
    </View>
  );
}
