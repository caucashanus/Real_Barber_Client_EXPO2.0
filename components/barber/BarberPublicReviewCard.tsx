import React from 'react';
import { View } from 'react-native';

import type { TeamMemberPageReview } from '@/api/publicTeamMember';
import Avatar from '@/components/Avatar';
import ShowRating from '@/components/ShowRating';
import ThemedText from '@/components/ThemedText';
import { formatReviewDate } from '@/utils/productDetailHelpers';

interface BarberPublicReviewCardProps {
  review: TeamMemberPageReview;
  locale: string;
}

export default function BarberPublicReviewCard({ review, locale }: BarberPublicReviewCardProps) {
  const text = review.text?.trim() ?? '';
  const author = review.authorName?.trim() || '—';

  return (
    <View className="w-[280px] rounded-lg bg-light-secondary p-4 dark:bg-dark-secondary">
      <View className="mb-2 flex-row items-center">
        <Avatar size="sm" src={review.authorAvatarUrl ?? undefined} name={author} className="mr-2" />
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
        <ShowRating rating={review.rating} size="sm" />
      </View>
      {text ? (
        <ThemedText className="text-sm leading-5 text-light-subtext dark:text-dark-subtext">
          {text}
        </ThemedText>
      ) : null}
    </View>
  );
}
