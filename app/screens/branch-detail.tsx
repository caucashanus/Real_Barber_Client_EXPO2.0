import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Linking,
  Modal,
  Animated,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getBranches, type Branch, type BranchService, type BranchEmployee } from '@/api/branches';
import { getEntityReviews, type EntityReviewItem } from '@/api/reviews';
import { useAuth } from '@/app/contexts/AuthContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import { CardScroller } from '@/components/CardScroller';
import Favorite from '@/components/Favorite';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import ImageCarousel from '@/components/ImageCarousel';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import ShowRating from '@/components/ShowRating';
import Icon from '@/components/Icon';

function getServicesList(branch: Branch): BranchService[] {
  const s = branch.services;
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return Object.values(s);
}

function getEmployeesList(branch: Branch): BranchEmployee[] {
  const e = branch.employees;
  if (!e) return [];
  if (Array.isArray(e)) return e;
  return Object.values(e);
}

function getMediaUrlsSorted(media: Branch['media']): string[] {
  if (!media) return [];
  const list = Array.isArray(media) ? [...media] : Object.values(media);
  const withOrder = list.filter((m): m is { url: string; order?: number } => !!m?.url);
  withOrder.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return withOrder.map((m) => m.url);
}

/** Only image URLs from media (excludes type === 'video'). */
function getMediaImageUrlsSorted(media: Branch['media']): string[] {
  if (!media) return [];
  const list = Array.isArray(media) ? [...media] : Object.values(media);
  const images = list.filter(
    (m): m is { url: string; order?: number; type?: string } =>
      !!m?.url && (m as { type?: string }).type !== 'video'
  );
  images.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return images.map((m) => m.url);
}

function branchImages(branch: Branch): (string | number)[] {
  const out: (string | number)[] = [];
  const mediaUrls = getMediaUrlsSorted(branch.media);
  mediaUrls.forEach((url) => out.push(url));
  if (branch.imageUrl) out.push(branch.imageUrl);
  const servicesList = getServicesList(branch);
  servicesList.forEach((svc) => {
    if (svc.imageUrl) out.push(svc.imageUrl);
  });
  if (out.length === 0) out.push(require('@/assets/img/barbers.png'));
  return out;
}

/** Images for carousel only: media images (no video), no branch.imageUrl. */
function branchCarouselImages(branch: Branch): (string | number)[] {
  const out: (string | number)[] = [];
  const mediaImageUrls = getMediaImageUrlsSorted(branch.media);
  mediaImageUrls.forEach((url) => out.push(url));
  const servicesList = getServicesList(branch);
  servicesList.forEach((svc) => {
    if (svc.imageUrl) out.push(svc.imageUrl);
  });
  if (out.length === 0) out.push(require('@/assets/img/barbers.png'));
  return out;
}

/** Marker logos per branch name (same as map markers). */
const BRANCH_MARKER_IMAGES: Record<string, import('react-native').ImageSourcePropType> = {
  Hagibor: require('@/assets/img/markers/hagiborbarrandov.png'),
  HAGIBOR: require('@/assets/img/markers/hagiborbarrandov.png'),
  Kačerov: require('@/assets/img/markers/kacerovbarbershop.png'),
  Kaceřov: require('@/assets/img/markers/kacerovbarbershop.png'),
  Modřany: require('@/assets/img/markers/modranybarbershop.png'),
  Barrandov: require('@/assets/img/markers/barrandovbarbershop.png'),
};

// 3D VR tour – manual mapping by branch name (data not from API)
const VR_TOUR_URL_BY_BRANCH_NAME: Record<string, string | null> = {
  Barrandov: null,
  Modřany: 'https://my.matterport.com/show/?m=SrYbx9DgJ3n',
  Kačerov: 'https://my.matterport.com/show/?m=YF7Q1K1ZiAX',
  Kaceřov: 'https://my.matterport.com/show/?m=YF7Q1K1ZiAX',
  Hagibor: 'https://my.matterport.com/show/?m=WPQ3ci9vZA1',
  HAGIBOR: 'https://my.matterport.com/show/?m=WPQ3ci9vZA1',
};

function getVrTourUrl(branchName: string): string | null {
  return VR_TOUR_URL_BY_BRANCH_NAME[branchName] ?? null;
}

const MAPS_URL_BY_BRANCH_NAME: Record<string, string | null> = {
  Barrandov: 'https://maps.app.goo.gl/FeQCjmPMCJJZpUek6?g_st=ic',
  Hagibor: 'https://maps.app.goo.gl/BTTTnrQwpSJTkEqcA?g_st=ic',
  HAGIBOR: 'https://maps.app.goo.gl/BTTTnrQwpSJTkEqcA?g_st=ic',
  Kačerov: 'https://maps.app.goo.gl/GRYWbciVFmcjG2am6?g_st=ic',
  Kaceřov: 'https://maps.app.goo.gl/GRYWbciVFmcjG2am6?g_st=ic',
  Modřany: 'https://maps.app.goo.gl/nMvYPXrezmN8yPQJ9?g_st=ic',
};

function getMapsUrl(branch: Branch): string | null {
  const fixed = MAPS_URL_BY_BRANCH_NAME[branch.name];
  if (fixed) return fixed;
  const query = branch.address || branch.name;
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Remove leading "O pobočce" / "O poboččce" from branch description. */
function stripDescriptionPrefix(text: string): string {
  return text.replace(/^o pobočč?e\s*/i, '').trimStart();
}

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

export default function BranchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { apiToken, client } = useAuth();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<EntityReviewItem[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState<number | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const heroScrollY = useRef(new Animated.Value(0)).current;
  const roundedViewYRef = useRef(0);
  const reviewsSectionYInRoundedRef = useRef(0);

  const scrollToReviews = useCallback(() => {
    const y = roundedViewYRef.current + reviewsSectionYInRoundedRef.current;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }, []);

  useEffect(() => {
    if (!apiToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getBranches(apiToken, { includeReviews: true, reviewsLimit: 1 })
      .then((list) => {
        const found = list.find((b) => b.id === id) ?? null;
        setBranch(found);
        if (!found) setError('Branch not found');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, id]);

  useEffect(() => {
    if (!apiToken || !branch?.id) return;
    setLoadingReviews(true);
    getEntityReviews(apiToken, 'branch', branch.id, { page: 1, limit: 9999, includeOwn: true })
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
  }, [apiToken, branch?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!apiToken || !branch?.id) return;
      getEntityReviews(apiToken, 'branch', branch.id, { page: 1, limit: 9999, includeOwn: true })
        .then((data) => {
          setReviews(data.reviews);
          setReviewsTotal(data.pagination.total);
          setHasReviewed(!!data.hasReviewed);
        })
        .catch(() => {});
    }, [apiToken, branch?.id])
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

  if (error || !branch) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary p-6 dark:bg-dark-primary">
          <ThemedText className="text-center text-red-500 dark:text-red-400">
            {error ?? 'Branch not found'}
          </ThemedText>
        </View>
      </>
    );
  }

  const images = branchCarouselImages(branch).map((img) => (typeof img === 'string' ? img : img));
  const employeesList = getEmployeesList(branch);
  const vrTourUrl = getVrTourUrl(branch.name);
  const webUrl = branch.webUrl ?? null;
  const branchImageUrl = getMediaUrlsSorted(branch.media)[0] ?? branch.imageUrl ?? '';
  const reviewParams = `entityType=branch&entityId=${encodeURIComponent(branch.id)}&entityName=${encodeURIComponent(branch.name)}${branchImageUrl ? `&entityImage=${encodeURIComponent(branchImageUrl)}` : ''}`;
  const rightComponents = branch.name
    ? [
        <Favorite
          key="fav"
          productName={branch.name}
          title={branch.name}
          entityType="branch"
          entityId={branch.id}
          size={25}
          isWhite
        />,
      ]
    : undefined;

  return (
    <>
      <StatusBar style="light" translucent />
      <Header variant="transparent" title="" rightComponents={rightComponents} showBackButton />
      <ThemedScroller
        ref={scrollRef}
        className="bg-light-primary px-0 dark:bg-dark-primary"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: heroScrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>
        <ImageCarousel
          images={images}
          height={500}
          paginationStyle="dots"
          autoPlay
          autoPlayInterval={3000}
          loop
          scrollY={heroScrollY}
          stretchOnPullDown
        />

        <View
          style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
          className="-mt-[30px] bg-light-primary p-global dark:bg-dark-primary"
          onLayout={(e: LayoutChangeEvent) => {
            roundedViewYRef.current = e.nativeEvent.layout.y;
          }}>
          <View className="">
            <ThemedText className="text-center text-3xl font-semibold">{branch.name}</ThemedText>
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
                  {hasReviewed ? t('branchUpdateReview') : t('branchReview')}
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => {
              const url = getMapsUrl(branch);
              if (url) Linking.openURL(url);
            }}
            className="mb-2 mt-8 flex-row items-center border-y border-neutral-200 py-global active:opacity-80 dark:border-dark-secondary">
            {BRANCH_MARKER_IMAGES[branch.name] ? (
              <Image
                source={BRANCH_MARKER_IMAGES[branch.name]}
                className="mr-4 h-12 w-12 rounded-lg"
                resizeMode="contain"
              />
            ) : (
              <Avatar size="md" name={branch.name} className="mr-4" />
            )}
            <View className="ml-0">
              <ThemedText className="text-base font-semibold">{t('branchTitle')}</ThemedText>
              <View className="flex-row items-center">
                <Icon name="MapPin" size={12} className="mr-1" />
                <ThemedText
                  className="text-xs text-light-subtext dark:text-dark-subtext"
                  numberOfLines={1}>
                  {branch.address ?? t('branchAddressNotSet')}
                </ThemedText>
              </View>
            </View>
          </Pressable>

          {branch.description
            ? (() => {
                const descriptionClean = stripDescriptionPrefix(branch.description);
                return descriptionClean ? (
                  <Section title={t('branchDescription')} titleSize="lg" className="mb-2 mt-2">
                    <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
                      {descriptionClean.length > 50
                        ? `${descriptionClean.slice(0, 50).trim()}… `
                        : descriptionClean}
                      {descriptionClean.length > 50 ? (
                        <ThemedText
                          onPress={() => setDescriptionModalVisible(true)}
                          style={{ color: colors.highlight }}
                          className="text-base font-medium">
                          {t('branchReadMore')}
                        </ThemedText>
                      ) : null}
                    </ThemedText>
                  </Section>
                ) : null;
              })()
            : null}

          {employeesList.length > 0 ? (
            <>
              <Divider className="mb-4 mt-4" />
              <Section title={t('branchTeam')} titleSize="lg" className="mb-6 mt-2">
                <View className="mt-3 flex-row flex-wrap gap-6">
                  {employeesList.map((emp: BranchEmployee) => (
                    <Pressable
                      key={emp.id}
                      onPress={() => router.push(`/screens/barber-detail?id=${emp.id}`)}
                      className="items-center active:opacity-70">
                      <Avatar size="lg" src={emp.avatarUrl ?? undefined} name={emp.name} />
                      <ThemedText className="mt-2 text-sm font-medium" numberOfLines={1}>
                        {emp.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </Section>
            </>
          ) : null}

          <Divider className="mb-4 mt-8" />

          <View
            onLayout={(e: LayoutChangeEvent) => {
              reviewsSectionYInRoundedRef.current = e.nativeEvent.layout.y;
            }}>
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
                                {t('branchMine')}
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
              <View className="mt-6 flex-row items-center justify-between rounded-lg bg-light-secondary p-4 dark:bg-dark-secondary">
                <View className="flex-row items-center">
                  <ShowRating rating={average} size="lg" />
                  <ThemedText className="ml-2 text-light-subtext dark:text-dark-subtext">
                    ({displayTotal})
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => setRatingModalVisible(true)}
                  style={{ backgroundColor: colors.highlight }}
                  className="rounded-lg px-3 py-2">
                  <ThemedText className="text-sm font-medium text-white">
                    {t('branchFullRating')}
                  </ThemedText>
                </Pressable>
              </View>
            </Section>
          </View>

          <Divider className="mb-4 mt-8" />

          <View className="mb-6">
            {vrTourUrl ? (
              <Pressable
                onPress={() => WebBrowser.openBrowserAsync(vrTourUrl)}
                className="mb-3 flex-row items-center rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
                <Icon name="Box" size={24} className="mr-3" />
                <View className="flex-1">
                  <ThemedText className="font-medium">3D VR tour</ThemedText>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('branchView3d')}
                  </ThemedText>
                </View>
                <Icon name="ChevronRight" size={20} className="opacity-60" />
              </Pressable>
            ) : null}
            {webUrl ? (
              <Pressable
                onPress={() => WebBrowser.openBrowserAsync(webUrl)}
                className="mb-3 flex-row items-center rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
                <Icon name="Globe" size={24} className="mr-3" />
                <View className="flex-1">
                  <ThemedText className="font-medium">{t('branchWeb')}</ThemedText>
                  <ThemedText
                    className="text-sm text-light-subtext dark:text-dark-subtext"
                    numberOfLines={1}>
                    {webUrl}
                  </ThemedText>
                </View>
                <Icon name="ChevronRight" size={20} className="opacity-60" />
              </Pressable>
            ) : null}
            <Pressable
              onPress={() =>
                router.push(`/screens/kudy-k-nam-detail?id=${encodeURIComponent(branch.id)}`)
              }
              className="mb-3 flex-row items-center rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
              <Icon name="MapPin" size={24} className="mr-3" />
              <View className="flex-1">
                <ThemedText className="font-medium">{t('howToGetToUs')}</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('kudyTransportParking')}
                </ThemedText>
              </View>
              <Icon name="ChevronRight" size={20} className="opacity-60" />
            </Pressable>
          </View>

          <Divider className="my-4" />
        </View>
      </ThemedScroller>

      <View
        style={{ paddingBottom: insets.bottom }}
        className="border-t border-neutral-200 bg-light-primary px-global pt-4 dark:border-dark-secondary dark:bg-dark-primary">
        <Button
          title={t('branchReserve')}
          variant="primary"
          className="w-full"
          size="medium"
          rounded="lg"
          href={`/screens/reservation-create?branchId=${encodeURIComponent(branch.id)}`}
        />
      </View>

      <Modal visible={descriptionModalVisible} transparent animationType="fade">
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => setDescriptionModalVisible(false)}>
          <Pressable
            className="max-h-[80%] rounded-t-3xl bg-light-primary dark:bg-dark-primary"
            onPress={(e) => e.stopPropagation()}>
            <View className="p-global pb-8">
              <View className="mb-4 flex-row items-center justify-between">
                <ThemedText className="text-lg font-semibold">{t('branchDescription')}</ThemedText>
                <Pressable
                  onPress={() => setDescriptionModalVisible(false)}
                  hitSlop={12}
                  className="p-2">
                  <Icon name="X" size={24} className="text-light-subtext dark:text-dark-subtext" />
                </Pressable>
              </View>
              <ScrollView className="max-h-96" showsVerticalScrollIndicator>
                <ThemedText className="whitespace-pre-line text-base text-light-subtext dark:text-dark-subtext">
                  {branch.description ? stripDescriptionPrefix(branch.description) : ''}
                </ThemedText>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={ratingModalVisible} transparent animationType="fade">
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => setRatingModalVisible(false)}>
          <Pressable
            className="rounded-t-3xl bg-light-primary p-global pb-8 dark:bg-dark-primary"
            onPress={(e) => e.stopPropagation()}>
            <View className="mb-4 flex-row items-center justify-between">
              <ThemedText className="text-lg font-semibold">{t('branchFullRating')}</ThemedText>
              <Pressable onPress={() => setRatingModalVisible(false)} hitSlop={12} className="p-2">
                <Icon name="X" size={24} className="text-light-subtext dark:text-dark-subtext" />
              </Pressable>
            </View>
            <View className="space-y-2">
              {([5, 4, 3, 2, 1] as const).map((stars) => (
                <View
                  key={stars}
                  className="flex-row items-center justify-between border-b border-neutral-200 py-3 dark:border-dark-secondary">
                  <ShowRating rating={stars} size="sm" displayMode="stars" />
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {countByRating[stars] ?? 0} {t('branchReviews')}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
