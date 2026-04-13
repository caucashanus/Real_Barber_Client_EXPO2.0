import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Animated,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getItemsAll, type Item } from '@/api/items';
import { getEntityReviews, type EntityReviewItem } from '@/api/reviews';
import { useAuth } from '@/app/contexts/AuthContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import { CardScroller } from '@/components/CardScroller';
import { Chip } from '@/components/Chip';
import Favorite from '@/components/Favorite';
import Header from '@/components/Header';
import ShowRating from '@/components/ShowRating';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';

function formatReviewDate(iso: string): string {
  try {
    const d = new Date(iso);
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

function useReviewStats(reviews: EntityReviewItem[]) {
  return React.useMemo(() => {
    const countByRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of reviews) {
      const rating = Math.min(5, Math.max(1, Math.round(r.rating) || 0));
      countByRating[rating] = (countByRating[rating] ?? 0) + 1;
      sum += r.rating;
    }
    const total = reviews.length;
    const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
    return { countByRating, average, total };
  }, [reviews]);
}

function itemImages(item: Item): (string | number)[] {
  const out: (string | number)[] = [];
  if (item.imageUrl) out.push(item.imageUrl);
  const media = item.media;
  if (media && Array.isArray(media)) {
    media.forEach((m: { url?: string }) => {
      if (m?.url) out.push(m.url);
    });
  }
  if (out.length === 0) out.push(require('@/assets/img/barbers.png'));
  return out;
}

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiToken, client } = useAuth();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<EntityReviewItem[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState<number | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const heroScrollY = useRef(new Animated.Value(0)).current;
  const contentYRef = useRef(0);
  const reviewsSectionYInContentRef = useRef(0);

  const scrollToReviews = useCallback(() => {
    const y = contentYRef.current + reviewsSectionYInContentRef.current;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }, []);

  useEffect(() => {
    if (!apiToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getItemsAll(apiToken, { includeMedia: true, includeEmployees: false, limit: 50 })
      .then((all) => {
        const found = all.find((i) => i.id === id) ?? null;
        setItem(found);
        if (!found) setError('Service not found');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, id]);

  useEffect(() => {
    if (!apiToken || !item?.id) return;
    setLoadingReviews(true);
    getEntityReviews(apiToken, 'item', item.id, { page: 1, limit: 9999, includeOwn: true })
      .then((data) => {
        setReviews(data.reviews);
        setReviewsTotal(data.pagination.total);
        setHasReviewed(!!data.hasReviewed);
      })
      .catch(() => {
        setReviews([]);
        setReviewsTotal(null);
        setHasReviewed(false);
      })
      .finally(() => setLoadingReviews(false));
  }, [apiToken, item?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!apiToken || !item?.id) return;
      getEntityReviews(apiToken, 'item', item.id, { page: 1, limit: 9999, includeOwn: true })
        .then((data) => {
          setReviews(data.reviews);
          setReviewsTotal(data.pagination.total);
          setHasReviewed(!!data.hasReviewed);
        })
        .catch(() => {});
    }, [apiToken, item?.id])
  );

  const { countByRating, average, total: reviewsComputedTotal } = useReviewStats(reviews);
  const displayTotal = reviewsTotal ?? reviewsComputedTotal;

  if (loading) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-4 text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      </>
    );
  }

  if (error || !item) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary p-6 dark:bg-dark-primary">
          <ThemedText className="text-center text-red-500 dark:text-red-400">
            {error ?? 'Service not found'}
          </ThemedText>
        </View>
      </>
    );
  }

  const images = itemImages(item);
  const itemImageUrl =
    item.imageUrl ?? (item.media && Array.isArray(item.media) ? item.media[0]?.url : undefined);
  const reviewParams = `entityType=item&entityId=${encodeURIComponent(item.id)}&entityName=${encodeURIComponent(item.name ?? '')}${itemImageUrl ? `&entityImage=${encodeURIComponent(itemImageUrl)}` : ''}`;
  const rightComponents = item.name
    ? [
        <Favorite
          key="fav"
          productName={item.name}
          title={item.name}
          entityType="item"
          entityId={item.id}
          size={25}
        />,
      ]
    : undefined;

  return (
    <>
      <Header title="" rightComponents={rightComponents} showBackButton />
      <ThemedScroller
        ref={scrollRef}
        className="bg-light-primary px-0 dark:bg-dark-primary"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: heroScrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>
        <Animated.View
          className="overflow-hidden bg-light-secondary dark:bg-dark-secondary"
          style={{
            transform: [
              {
                scale: heroScrollY.interpolate({
                  inputRange: [-160, 0],
                  outputRange: [1.18, 1],
                  extrapolate: 'clamp',
                }),
              },
              {
                translateY: heroScrollY.interpolate({
                  inputRange: [-160, 0],
                  outputRange: [-20, 0],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}>
          <Image
            source={typeof images[0] === 'string' ? { uri: images[0] } : images[0]}
            className="w-full"
            style={{ aspectRatio: 4 / 3 }}
            resizeMode="cover"
          />
        </Animated.View>

        <View
          className="p-global"
          onLayout={(e: LayoutChangeEvent) => {
            contentYRef.current = e.nativeEvent.layout.y;
          }}>
          <ThemedText className="text-2xl font-bold">{item.name}</ThemedText>
          <View className="mt-4 flex-row items-center justify-center">
            <Pressable
              onPress={scrollToReviews}
              className="flex-row items-center active:opacity-70">
              <ShowRating
                rating={average}
                size="lg"
                className="border-r border-neutral-200 px-4 py-2 dark:border-dark-secondary"
              />
              <ThemedText className="px-4 text-base">{t('profileReviews')}</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/screens/review?${reviewParams}`)}
              className="ml-4 rounded-lg bg-light-secondary px-3 py-2 dark:bg-dark-secondary">
              <ThemedText className="text-sm font-medium">
                {hasReviewed ? t('serviceUpdateReview') : t('serviceReview')}
              </ThemedText>
            </Pressable>
          </View>

          {item.category ? (
            <View className="mt-3">
              <Chip label={item.category} size="md" className="self-start" />
            </View>
          ) : null}

          <Divider className="my-6" />

          {item.description ? (
            <Section title={t('serviceAbout')} titleSize="lg" className="mb-6">
              <ThemedText className="mt-2 leading-6 text-light-subtext dark:text-dark-subtext">
                {item.description}
              </ThemedText>
            </Section>
          ) : (
            <Section title={t('serviceAbout')} titleSize="lg" className="mb-6">
              <ThemedText className="mt-2 italic text-light-subtext dark:text-dark-subtext">
                No description available.
              </ThemedText>
            </Section>
          )}

          <Divider className="mb-4 mt-8" />

          <View
            onLayout={(e: LayoutChangeEvent) => {
              reviewsSectionYInContentRef.current = e.nativeEvent.layout.y;
            }}>
            <Section
              title={t('profileReviews')}
              titleSize="lg"
              subtitle={`${displayTotal} ${t('branchReviews')}`}
              className="mb-6">
              <View className="mt-4 rounded-lg bg-light-secondary p-4 dark:bg-dark-secondary">
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
                        {countByRating[stars] ?? 0} {t('branchReviews')}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
              <View className="mb-3 mt-6 flex-row items-center justify-between">
                <ThemedText className="text-lg font-semibold">{t('profileReviews')}</ThemedText>
                <Pressable
                  onPress={() => router.push(`/screens/review?${reviewParams}`)}
                  className="rounded-lg bg-light-secondary px-3 py-2 dark:bg-dark-secondary">
                  <ThemedText className="text-sm font-medium">
                    {hasReviewed ? t('serviceUpdateReview') : t('serviceWriteReview')}
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
                    const isOwnReview = client?.id != null && review.client?.id === client.id;
                    return (
                      <View
                        key={review.id}
                        className="w-[280px] rounded-lg bg-light-secondary p-4 dark:bg-dark-secondary">
                        <View className="mb-2 flex-row items-center justify-between">
                          <View className="min-w-0 flex-1 flex-row items-center">
                            {review.isAnonymous ? (
                              <Image
                                source={require('@/assets/img/wallet/realbarber.png')}
                                className="mr-2 h-10 w-10 rounded-full"
                                resizeMode="cover"
                              />
                            ) : review.client?.avatarUrl ? (
                              <Image
                                source={{ uri: review.client.avatarUrl }}
                                className="mr-2 h-10 w-10 rounded-full"
                              />
                            ) : (
                              <Avatar
                                size="sm"
                                name={review.client?.name ?? '?'}
                                className="mr-2"
                              />
                            )}
                            <View className="min-w-0">
                              <ThemedText className="font-medium" numberOfLines={1}>
                                {review.isAnonymous
                                  ? 'Anonymous'
                                  : (review.client?.name ?? 'Anonymous')}
                              </ThemedText>
                              <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                                {formatReviewDate(review.createdAt)}
                              </ThemedText>
                            </View>
                          </View>
                          {isOwnReview && (
                            <View
                              style={{ backgroundColor: colors.highlight }}
                              className="ml-2 rounded-md px-2 py-1">
                              <ThemedText className="text-xs font-medium text-white">
                                {t('commonEdit')}
                              </ThemedText>
                            </View>
                          )}
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
            </Section>
          </View>

          <Divider className="my-4" />
        </View>
      </ThemedScroller>

      <View
        style={{ paddingBottom: insets.bottom }}
        className="flex-row items-center justify-start border-t border-neutral-200 bg-light-primary px-global pt-4 dark:border-dark-secondary dark:bg-dark-primary">
        <View>
          <ThemedText className="text-xl font-bold">{t('serviceBookThisService')}</ThemedText>
          <ThemedText className="text-xs opacity-60">{t('serviceChooseBranchBarber')}</ThemedText>
        </View>
        <View className="ml-auto flex-row items-center">
          <Button
            title={t('commonReserve')}
            variant="primary"
            className="ml-6 px-6"
            size="medium"
            rounded="lg"
            href={`/screens/reservation-create?itemId=${encodeURIComponent(item.id)}&itemName=${encodeURIComponent(item.name ?? '')}`}
          />
        </View>
      </View>
    </>
  );
}
