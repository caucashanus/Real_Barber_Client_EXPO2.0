import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { EntityReviewItem } from '@/api/reviews';
import useThemeColors from '@/app/contexts/ThemeColors';
import Avatar from '@/components/Avatar';
import ShowRating from '@/components/ShowRating';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { formatReviewDate } from '@/utils/productDetailHelpers';

interface EntityReviewCardProps {
  review: EntityReviewItem;
  locale: string;
  isOwnReview: boolean;
  reviewParams: string;
  t: (key: TranslationKey) => string;
  ownReviewMode?: 'edit' | 'badge';
  editLabelKey?: TranslationKey;
  badgeLabelKey?: TranslationKey;
}

export default function EntityReviewCard({
  review,
  locale,
  isOwnReview,
  reviewParams,
  t,
  ownReviewMode = 'badge',
  editLabelKey = 'barberUpdateReview',
  badgeLabelKey = 'branchMine',
}: EntityReviewCardProps) {
  const colors = useThemeColors();
  const editParams =
    review.entityType === 'reservation' && review.entityId
      ? `entityType=reservation&entityId=${encodeURIComponent(review.entityId)}`
      : reviewParams;

  return (
    <View className="w-[280px] rounded-lg bg-light-secondary p-4 dark:bg-dark-secondary">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="min-w-0 flex-1 flex-row items-center">
          {review.isAnonymous ? (
            <Image
              source={require('@/assets/img/wallet/realbarber.png')}
              className="mr-2 h-10 w-10 rounded-full"
              contentFit="cover"
            />
          ) : review.client?.avatarUrl ? (
            <Image
              source={{ uri: review.client.avatarUrl }}
              className="mr-2 h-10 w-10 rounded-full"
            />
          ) : (
            <Avatar size="sm" name={review.client?.name ?? '?'} className="mr-2" />
          )}
          <View className="min-w-0">
            <ThemedText className="font-medium" numberOfLines={1}>
              {review.isAnonymous ? 'Anonymous' : (review.client?.name ?? 'Anonymous')}
            </ThemedText>
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
              {formatReviewDate(review.createdAt, locale)}
            </ThemedText>
          </View>
        </View>
        {isOwnReview && ownReviewMode === 'edit' ? (
          <Pressable
            onPress={() => router.push(`/screens/review?${editParams}` as any)}
            className="ml-2 rounded-md bg-light-primary px-2 py-1 dark:bg-dark-primary">
            <ThemedText className="text-xs font-medium">{t(editLabelKey)}</ThemedText>
          </Pressable>
        ) : null}
        {isOwnReview && ownReviewMode === 'badge' ? (
          <View style={{ backgroundColor: colors.highlight }} className="ml-2 rounded-md px-2 py-1">
            <ThemedText className="text-xs font-medium text-white">{t(badgeLabelKey)}</ThemedText>
          </View>
        ) : null}
      </View>
      <ShowRating rating={review.rating} size="sm" className="mb-2" />
      <ThemedText className="text-sm">
        {review.description || review.positiveFeedback || '—'}
      </ThemedText>
    </View>
  );
}
