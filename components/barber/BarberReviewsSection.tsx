import { router } from 'expo-router';
import React from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';

import type { TeamMemberPageReview } from '@/api/publicTeamMember';
import { Button } from '@/components/Button';
import { CardScroller } from '@/components/CardScroller';
import BarberPublicReviewCard from '@/components/barber/BarberPublicReviewCard';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';

interface BarberReviewsSectionProps {
  reviews: TeamMemberPageReview[];
  hasReviewed: boolean;
  ownReviewIds: Set<string>;
  reviewParams: string;
  displayTotal: number;
  locale: string;
  showPagination: boolean;
  reviewsLoading: boolean;
  reviewsError: string | null;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  embedded?: boolean;
  t: (key: TranslationKey) => string;
}

export default function BarberReviewsSection({
  reviews,
  hasReviewed,
  ownReviewIds,
  reviewParams,
  displayTotal,
  locale,
  showPagination,
  reviewsLoading,
  reviewsError,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onLayout,
  embedded = false,
  t,
}: BarberReviewsSectionProps) {
  return (
    <View onLayout={onLayout} nativeID="recenze">
      <Section
        header={
          <View>
            <View className="flex-row items-center gap-2">
              <ThemedText className="text-lg font-semibold">{t('profileReviews')}</ThemedText>
              <Pressable
                onPress={() => router.push(`/screens/review?${reviewParams}` as never)}
                className="shrink-0 rounded-lg bg-light-secondary px-3 py-2 dark:bg-dark-secondary">
                <ThemedText className="text-sm font-medium">
                  {hasReviewed ? t('barberUpdateReview') : t('barberWriteReview')}
                </ThemedText>
              </Pressable>
            </View>
            <ThemedText className="text-light-subtext dark:text-dark-subtext">
              {displayTotal} {t('branchReviews')}
            </ThemedText>
          </View>
        }
      >
        {reviews.length === 0 ? (
          <ThemedText className="mt-4 py-4 text-sm text-light-subtext dark:text-dark-subtext">
            {t('barberNoReviews')}
          </ThemedText>
        ) : (
          <View className={`mt-4 ${showPagination ? BARBER_DETAIL_SECTION_SPACING : ''}`}>
            <CardScroller space={10}>
              {reviews.map((review) => (
                <BarberPublicReviewCard
                  key={review.id}
                  review={review}
                  locale={locale}
                  isOwnReview={ownReviewIds.has(review.id)}
                  reviewParams={reviewParams}
                  embedded={embedded}
                  t={t}
                />
              ))}
            </CardScroller>
          </View>
        )}

        {reviewsError ? (
          <ThemedText className="mt-3 text-sm text-red-500 dark:text-red-400">
            {t('barberReviewsLoadError')}
          </ThemedText>
        ) : null}

        {showPagination ? (
          <View className="flex-row items-center justify-center gap-3">
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
                void onNext();
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
