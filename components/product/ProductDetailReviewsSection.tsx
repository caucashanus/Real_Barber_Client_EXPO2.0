import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, View, type LayoutChangeEvent } from 'react-native';

import type { ClientCatalogProductReview, ClientProductPurchase } from '@/api/products';
import type { EntityReviewItem } from '@/api/reviews';
import useThemeColors from '@/app/contexts/ThemeColors';
import Avatar from '@/components/Avatar';
import { CardScroller } from '@/components/CardScroller';
import ShowRating from '@/components/ShowRating';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import {
  catalogReviewBody,
  catalogReviewDisplayName,
  computeReviewStats,
  formatReviewDate,
} from '@/utils/productDetailHelpers';

interface ProductDetailReviewsSectionProps {
  purchase: ClientProductPurchase | null;
  catalogReviewsList: ClientCatalogProductReview[];
  hasCatalogReviews: boolean;
  reviews: EntityReviewItem[];
  reviewsTotal: number | null;
  loadingReviews: boolean;
  hasReviewed: boolean;
  reviewParams: string;
  clientId?: string;
  locale: string;
  onLayout: (e: LayoutChangeEvent) => void;
  t: (key: TranslationKey) => string;
}

export default function ProductDetailReviewsSection({
  purchase,
  catalogReviewsList,
  hasCatalogReviews,
  reviews,
  reviewsTotal,
  loadingReviews,
  hasReviewed,
  reviewParams,
  clientId,
  locale,
  onLayout,
  t,
}: ProductDetailReviewsSectionProps) {
  const colors = useThemeColors();
  const { countByRating, average, total: reviewsComputedTotal } = computeReviewStats(reviews);
  const displayTotal = reviewsTotal ?? reviewsComputedTotal;
  const catalogReviewStats = computeReviewStats(hasCatalogReviews ? catalogReviewsList : []);

  const subtitle = purchase
    ? `${displayTotal} reviews`
    : `${catalogReviewStats.total} ${t('productReviewsCount')}`;

  return (
    <View onLayout={onLayout}>
      <Section title={t('productBuyerReviews')} titleSize="lg" subtitle={subtitle} className="mb-6">
        {purchase ? (
          <>
            <View className="mt-4 rounded-lg bg-light-secondary p-card dark:bg-dark-secondary">
              <View className="mb-4 flex-row items-center">
                <ShowRating rating={average} size="lg" />
                <ThemedText className="ml-2 text-light-subtext dark:text-dark-subtext">
                  ({displayTotal})
                </ThemedText>
              </View>
              <View className="space-y-2">
                {([5, 4, 3, 2, 1] as const).map((stars) => (
                  <View key={stars} className="flex-row items-center justify-between py-1.5">
                    <ShowRating rating={stars} size="sm" displayMode="stars" />
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                      {countByRating[stars] ?? 0} reviews
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
            <View className="mb-3 mt-6 flex-row items-center justify-between">
              <ThemedText variant="h4">{t('productBuyerReviews')}</ThemedText>
              <Pressable
                onPress={() => router.push(`/screens/review?${reviewParams}`)}
                className="rounded-lg bg-light-secondary px-3 py-2 dark:bg-dark-secondary">
                <ThemedText variant="bodySm">
                  {hasReviewed ? t('reviewUpdate') : t('productNapsatRecenzi')}
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
                    <View
                      key={review.id}
                      className="w-[280px] rounded-lg bg-light-secondary p-card dark:bg-dark-secondary">
                      <View className="mb-2 flex-row items-center justify-between">
                        <View className="min-w-0 flex-1 flex-row items-center">
                          {review.client?.avatarUrl ? (
                            <Image
                              source={{ uri: review.client.avatarUrl }}
                              className="mr-2 h-10 w-10 rounded-full"
                            />
                          ) : (
                            <Avatar size="sm" name={review.client?.name ?? '?'} className="mr-2" />
                          )}
                          <View className="min-w-0">
                            <ThemedText variant="body" numberOfLines={1}>
                              {review.client?.name ?? t('productReviewAuthorAnonymous')}
                            </ThemedText>
                            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                              {formatReviewDate(review.createdAt, locale)}
                            </ThemedText>
                          </View>
                        </View>
                        {isOwnReview ? (
                          <View
                            style={{ backgroundColor: colors.highlight }}
                            className="ml-2 rounded-md px-2 py-1">
                            <ThemedText variant="caption" className="text-white">
                              {t('productEdit')}
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                      <ShowRating rating={review.rating} size="sm" className="mb-2" />
                      <ThemedText className="text-sm">
                        {review.description || review.positiveFeedback || '—'}
                      </ThemedText>
                    </View>
                  );
                })}
              </CardScroller>
            )}
          </>
        ) : (
          <>
            <View className="mt-4 rounded-lg bg-light-secondary p-card dark:bg-dark-secondary">
              <View className="mb-4 flex-row items-center">
                <ShowRating rating={catalogReviewStats.average} size="lg" />
                <ThemedText className="ml-2 text-light-subtext dark:text-dark-subtext">
                  ({catalogReviewStats.total})
                </ThemedText>
              </View>
              <View className="space-y-2">
                {([5, 4, 3, 2, 1] as const).map((stars) => (
                  <View key={stars} className="flex-row items-center justify-between py-1.5">
                    <ShowRating rating={stars} size="sm" displayMode="stars" />
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                      {catalogReviewStats.countByRating[stars] ?? 0} reviews
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
            <View className="mb-3 mt-6 flex-row items-center justify-between">
              <ThemedText variant="h4">{t('productBuyerReviews')}</ThemedText>
            </View>
            <CardScroller className="mt-1" space={10}>
              {catalogReviewsList.map((review) => {
                const authorName = catalogReviewDisplayName(
                  review,
                  t('productReviewAuthorAnonymous')
                );
                const avatarUri = review.isAnonymous ? '' : (review.author?.avatarUrl ?? '');
                return (
                  <View
                    key={review.id}
                    className="w-[280px] rounded-lg bg-light-secondary p-card dark:bg-dark-secondary">
                    <View className="mb-2 flex-row items-center">
                      {avatarUri ? (
                        <Image
                          source={{ uri: avatarUri }}
                          className="mr-2 h-10 w-10 rounded-full"
                        />
                      ) : (
                        <Avatar size="sm" name={authorName} className="mr-2" />
                      )}
                      <View className="min-w-0 flex-1">
                        <ThemedText variant="body" numberOfLines={1}>
                          {authorName}
                        </ThemedText>
                        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                          {formatReviewDate(review.createdAt, locale)}
                        </ThemedText>
                      </View>
                    </View>
                    <ShowRating rating={review.rating} size="sm" className="mb-2" />
                    <ThemedText className="text-sm">{catalogReviewBody(review)}</ThemedText>
                  </View>
                );
              })}
            </CardScroller>
          </>
        )}
      </Section>
    </View>
  );
}

export function productDetailHeaderReviewSummary(params: {
  purchase: ClientProductPurchase | null;
  hasCatalogReviews: boolean;
  catalogReviewStats: ReturnType<typeof computeReviewStats>;
  reviewsAverage: number;
  displayTotal: number;
  t: (key: TranslationKey) => string;
}): { rating: number; label: string } {
  const { purchase, hasCatalogReviews, catalogReviewStats, reviewsAverage, displayTotal, t } =
    params;

  if (purchase) {
    return { rating: reviewsAverage, label: `${displayTotal} Reviews` };
  }
  if (hasCatalogReviews) {
    return {
      rating: catalogReviewStats.average,
      label: `${catalogReviewStats.total} ${t('productReviewsCount')}`,
    };
  }
  return { rating: 0, label: '' };
}
