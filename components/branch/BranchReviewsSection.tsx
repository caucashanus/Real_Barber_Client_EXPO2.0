import { router } from 'expo-router';
import React from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';

import type { EntityReviewItem } from '@/api/reviews';
import { Button } from '@/components/Button';
import { CardScroller } from '@/components/CardScroller';
import ThemedText from '@/components/ThemedText';
import EntityReviewCard from '@/components/detail/EntityReviewCard';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';

interface BranchReviewsSectionProps {
  reviews: EntityReviewItem[];
  hasReviewed: boolean;
  reviewParams: string;
  displayTotal: number;
  clientId?: string | number | null;
  ownReviewIds?: Set<string>;
  locale: string;
  onLayout: (e: LayoutChangeEvent) => void;
  showPagination?: boolean;
  reviewsLoading?: boolean;
  reviewsError?: string | null;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  t: (key: TranslationKey) => string;
}

export default function BranchReviewsSection({
  reviews,
  hasReviewed,
  reviewParams,
  displayTotal,
  clientId,
  ownReviewIds,
  locale,
  onLayout,
  showPagination = false,
  reviewsLoading = false,
  reviewsError = null,
  canGoPrevious = false,
  canGoNext = false,
  onPrevious,
  onNext,
  t,
}: BranchReviewsSectionProps) {
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

        {reviews.length === 0 ? (
          <ThemedText className="mt-1 py-4 text-sm text-light-subtext dark:text-dark-subtext">
            {t('barberNoReviews')}
          </ThemedText>
        ) : (
          <View className={showPagination ? BARBER_DETAIL_SECTION_SPACING : ''}>
            <CardScroller className="mt-1" space={10}>
              {reviews.map((review) => {
                const isOwnReview = ownReviewIds
                  ? ownReviewIds.has(review.id)
                  : clientId != null && review.client?.id === clientId;
                return (
                  <EntityReviewCard
                    key={review.id}
                    review={review}
                    locale={locale}
                    isOwnReview={Boolean(isOwnReview)}
                    reviewParams={reviewParams}
                    ownReviewMode="badge"
                    t={t}
                  />
                );
              })}
            </CardScroller>
          </View>
        )}

        {reviewsError ? (
          <ThemedText className="mt-3 text-sm text-red-500 dark:text-red-400">
            {t('barberReviewsLoadError')}
          </ThemedText>
        ) : null}

        {showPagination ? (
          <View className="mt-4 flex-row items-center justify-center gap-3">
            <Button
              title={t('barberReviewsPrevious')}
              variant="outline"
              size="small"
              rounded="lg"
              onPress={onPrevious}
              disabled={!canGoPrevious}
            />
            <Button
              title={reviewsLoading ? t('barberReviewsLoading') : t('barberReviewsNext')}
              variant="outline"
              size="small"
              rounded="lg"
              onPress={() => {
                void onNext?.();
              }}
              disabled={!canGoNext}
              loading={reviewsLoading}
            />
          </View>
        ) : null}
      </Section>
    </View>
  );
}
