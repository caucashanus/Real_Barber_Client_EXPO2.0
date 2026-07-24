import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { TeamMemberPageReview } from '@/api/publicTeamMember';
import Avatar from '@/components/Avatar';
import ShowRating from '@/components/ShowRating';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { formatReviewDate, normalizeReviewDisplayText } from '@/utils/productDetailHelpers';

interface BarberPublicReviewCardProps {
  review: TeamMemberPageReview;
  locale: string;
  isOwnReview?: boolean;
  reviewParams?: string;
  /** Sheet / combined card — kontrast vůči `colors.sheet`, ne `bg-light-primary`. */
  embedded?: boolean;
  t: (key: TranslationKey) => string;
}

export default function BarberPublicReviewCard({
  review,
  locale,
  isOwnReview = false,
  reviewParams = '',
  embedded = false,
  t,
}: BarberPublicReviewCardProps) {
  const text = normalizeReviewDisplayText(review.text);
  const author = review.authorName?.trim() || t('productReviewAuthorAnonymous');
  const surfaceClass = embedded
    ? 'border border-neutral-200 bg-light-secondary dark:border-neutral-700 dark:bg-dark-primary'
    : 'bg-light-secondary dark:bg-dark-secondary';

  return (
    <View className={`w-[280px] rounded-lg p-4 ${surfaceClass}`}>
      <View className="mb-2 flex-row items-center justify-between">
        <View className="min-w-0 flex-1 flex-row items-center">
          <Avatar
            size="sm"
            src={review.authorAvatarUrl ?? undefined}
            name={author}
            fallbackIcon="CircleUserRound"
            className="mr-2"
          />
          <View className="min-w-0 flex-1">
            <ThemedText className="font-medium" numberOfLines={1}>
              {author}
            </ThemedText>
            {review.createdAt ? (
              <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                {formatReviewDate(review.createdAt, locale)}
              </ThemedText>
            ) : null}
          </View>
        </View>
        {isOwnReview && reviewParams ? (
          <Pressable
            onPress={() => router.push(`/screens/review?${reviewParams}` as never)}
            className="ml-2 rounded-md bg-light-primary px-2 py-1 dark:bg-dark-primary">
            <ThemedText className="text-xs font-medium">{t('barberUpdateReview')}</ThemedText>
          </Pressable>
        ) : (
          <ShowRating rating={review.rating} size="sm" />
        )}
      </View>
      {isOwnReview ? <ShowRating rating={review.rating} size="sm" className="mb-2" /> : null}
      {text ? (
        <ThemedText className="text-sm leading-5 text-light-subtext dark:text-dark-subtext">
          {text}
        </ThemedText>
      ) : null}
    </View>
  );
}
