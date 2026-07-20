import { router } from 'expo-router';
import React from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';

import type { TeamMemberPageReview } from '@/api/publicTeamMember';
import { CardScroller } from '@/components/CardScroller';
import BarberPublicReviewCard from '@/components/barber/BarberPublicReviewCard';
import ThemedText from '@/components/ThemedText';
import RatingBreakdownPanel from '@/components/detail/RatingBreakdownPanel';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

interface BarberReviewsSectionProps {
  reviews: TeamMemberPageReview[];
  hasReviewed: boolean;
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
  hasReviewed,
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
        className="mb-6 mt-8">
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
              onPress={() => router.push(`/screens/review?${reviewParams}` as never)}
              className="rounded-lg bg-light-secondary px-3 py-2 dark:bg-dark-secondary">
              <ThemedText className="text-sm font-medium">{t('barberWriteReview')}</ThemedText>
            </Pressable>
          ) : null}
        </View>
        {reviews.length === 0 ? (
          <ThemedText className="py-4 text-sm text-light-subtext dark:text-dark-subtext">
            {t('barberNoReviews')}
          </ThemedText>
        ) : (
          <CardScroller className="mt-1" space={10}>
            {reviews.map((review) => (
              <BarberPublicReviewCard key={review.id} review={review} locale={locale} />
            ))}
          </CardScroller>
        )}
      </Section>
    </View>
  );
}
