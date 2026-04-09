import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Image, ActivityIndicator, Pressable, ScrollView, Modal, Animated, useWindowDimensions, FlatList, type LayoutChangeEvent } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import VideoPlayer from '@/components/VideoPlayer';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import Divider from '@/components/layout/Divider';
import ShowRating from '@/components/ShowRating';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import Favorite from '@/components/Favorite';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  getEmployeeById,
  getEmployees,
  type EmployeeDetail,
  type EmployeeBranch,
  type EmployeeService,
  type EmployeeMediaItem,
} from '@/api/employees';
import Section from '@/components/layout/Section';
import Icon from '@/components/Icon';
import { router } from 'expo-router';
import { CardScroller } from '@/components/CardScroller';
import { getEntityReviews, type EntityReviewItem } from '@/api/reviews';
import { useTranslation } from '@/app/hooks/useTranslation';
import useThemeColors from '@/app/contexts/ThemeColors';

type TopSlide = { type: 'image' | 'video'; uri: string };

function employeeTopSlides(employee: EmployeeDetail): TopSlide[] {
  const out: TopSlide[] = [];
  if (employee.avatarUrl) out.push({ type: 'image', uri: employee.avatarUrl });
  const mediaList = getMediaList(employee);
  mediaList.forEach((m) => out.push({ type: (m.type === 'video' ? 'video' : 'image'), uri: m.url }));
  if (out.length === 0) out.push({ type: 'image', uri: '' });
  return out;
}

function getBranchesList(employee: EmployeeDetail): EmployeeBranch[] {
  const b = employee.branches;
  if (!b) return [];
  if (Array.isArray(b)) return b;
  return Object.values(b);
}

function getServicesList(employee: EmployeeDetail): EmployeeService[] {
  const s = employee.services;
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return Object.values(s);
}

function getMediaList(employee: EmployeeDetail): EmployeeMediaItem[] {
  const m = employee.media;
  if (!m) return [];
  const list = Array.isArray(m) ? [...m] : Object.values(m);
  const withUrl = list.filter((item) => item?.url);
  withUrl.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return withUrl;
}

type CategoryGroup = { categoryId: string; categoryName: string; services: EmployeeService[] };

function groupServicesByCategory(services: EmployeeService[]): CategoryGroup[] {
  const byId = new Map<string, CategoryGroup>();
  for (const svc of services) {
    const id = svc.category?.id ?? 'unknown';
    const name = svc.category?.name ?? '—';
    if (!byId.has(id)) byId.set(id, { categoryId: id, categoryName: name, services: [] });
    byId.get(id)!.services.push(svc);
  }
  return Array.from(byId.values());
}

function formatReviewDate(iso: string): string {
  try {
    const d = new Date(iso);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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

export default function BarberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiToken, client } = useAuth();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<EmployeeMediaItem | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [reviews, setReviews] = useState<EntityReviewItem[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState<number | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const topCarouselRef = useRef<FlatList>(null);
  const carouselWidth = winWidth;

  const topSlides = useMemo(() => (employee ? employeeTopSlides(employee) : []), [employee]);

  useEffect(() => {
    if (!apiToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setDescription(null);
    Promise.all([
      getEmployeeById(apiToken, id),
      getEmployees(apiToken, { includeReviews: true, reviewsLimit: 1 }).catch(() => [] as EmployeeDetail[]),
    ])
      .then(([detail, list]) => {
        setEmployee(detail);
        const arr = Array.isArray(list) ? list : Object.values(list);
        const fromList = arr.find((e) => e.id === id);
        if (fromList?.description) setDescription(fromList.description);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, id]);

  useEffect(() => {
    if (!apiToken || !id) return;
    setLoadingReviews(true);
    getEntityReviews(apiToken, 'employee', id, { page: 1, limit: 9999, includeOwn: true })
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
  }, [apiToken, id]);

  useFocusEffect(
    useCallback(() => {
      if (!apiToken || !id) return;
      getEntityReviews(apiToken, 'employee', id, { page: 1, limit: 9999, includeOwn: true })
        .then((data) => {
          setReviews(data.reviews);
          setReviewsTotal(data.pagination.total);
          setHasReviewed(!!data.hasReviewed);
        })
        .catch(() => {});
    }, [apiToken, id])
  );

  const { countByRating, average, total: reviewsComputedTotal } = useReviewStats(reviews);
  const displayTotal = reviewsTotal ?? reviewsComputedTotal;
  const scrollRef = useRef<ScrollView>(null);
  const heroScrollY = useRef(new Animated.Value(0)).current;
  const roundedViewYRef = useRef(0);
  const reviewsSectionYInRoundedRef = useRef(0);

  const scrollToReviews = useCallback(() => {
    const y = roundedViewYRef.current + reviewsSectionYInRoundedRef.current;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }, []);

  if (loading) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-4 text-light-subtext dark:text-dark-subtext">{t('commonLoading')}</ThemedText>
        </View>
      </>
    );
  }

  if (error || !employee) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary p-6">
          <ThemedText className="text-center text-red-500 dark:text-red-400">{error ?? 'Barber not found'}</ThemedText>
        </View>
      </>
    );
  }

  const employeeImageUrl = employee.avatarUrl ?? '';
  const CAROUSEL_HEIGHT = 500;
  const reviewParams = `entityType=employee&entityId=${encodeURIComponent(employee.id)}&entityName=${encodeURIComponent(employee.name)}${employeeImageUrl ? `&entityImage=${encodeURIComponent(employeeImageUrl)}` : ''}`;
  const rightComponents = employee.name ? [
    <Favorite
      key="fav"
      productName={employee.name}
      title={employee.name}
      entityType="employee"
      entityId={employee.id}
      size={25}
      isWhite
    />,
  ] : undefined;

  return (
    <>
      <StatusBar style="light" translucent />
      <Header variant="transparent" title="" rightComponents={rightComponents} showBackButton />
      <ThemedScroller
        ref={scrollRef}
        className="px-0 bg-light-primary dark:bg-dark-primary"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: heroScrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      >
        <Animated.View
          style={{
            height: CAROUSEL_HEIGHT,
            width: carouselWidth,
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
          }}
        >
          <FlatList
            ref={topCarouselRef}
            data={topSlides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / carouselWidth);
              setActiveCarouselIndex(idx);
            }}
            renderItem={({ item, index }) => (
              <View style={{ width: carouselWidth, height: CAROUSEL_HEIGHT }}>
                {item.type === 'video' ? (
                  <VideoPlayer
                    uri={item.uri}
                    style={{ width: carouselWidth, height: CAROUSEL_HEIGHT }}
                    contentFit="cover"
                    shouldPlay={activeCarouselIndex === index}
                    isMuted
                    isLooping
                  />
                ) : (
                  <Image
                    source={item.uri ? { uri: item.uri } : require('@/assets/img/barbers.png')}
                    style={{ width: carouselWidth, height: CAROUSEL_HEIGHT }}
                    resizeMode="cover"
                  />
                )}
              </View>
            )}
          />
          {topSlides.length > 1 ? (
            <View className="flex-row justify-center absolute bottom-4 w-full">
              {topSlides.map((_, index) => (
                <View
                  key={index}
                  className={`h-2 w-2 rounded-full mx-1 ${index === activeCarouselIndex ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </View>
          ) : null}
        </Animated.View>

        <View
          style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
          className="p-global bg-light-primary dark:bg-dark-primary -mt-[30px]"
          onLayout={(e: LayoutChangeEvent) => { roundedViewYRef.current = e.nativeEvent.layout.y; }}
        >
          <View className="">
            <ThemedText className="text-3xl text-center font-semibold">{employee.name}</ThemedText>
            <View className="flex-row items-center justify-center mt-4">
              <Pressable onPress={scrollToReviews} className="flex-row items-center active:opacity-70">
                <ShowRating rating={average} size="lg" className="px-4 py-2 border-r border-neutral-200 dark:border-dark-secondary" />
                <ThemedText className="text-base px-4">{t('profileReviews')}</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => router.push(`/screens/review?${reviewParams}`)}
                className="ml-4 px-3 py-2 rounded-lg bg-light-secondary dark:bg-dark-secondary"
              >
                <ThemedText className="text-sm font-medium">{hasReviewed ? t('barberUpdateReview') : t('barberReview')}</ThemedText>
              </Pressable>
            </View>
          </View>

          <View className="mt-8 mb-8 py-global border-y border-neutral-200 dark:border-dark-secondary">
            <View className="flex-row items-center mb-3">
              <Avatar size="md" src={employee.avatarUrl ?? undefined} name={employee.name} className="mr-4" />
              <ThemedText className="font-semibold text-base">{t('barberAboutMe')}</ThemedText>
            </View>
            {description ? (
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext" style={{ lineHeight: 22 }}>
                {description}
              </ThemedText>
            ) : null}
          </View>

          {getMediaList(employee).length > 0 ? (
            <>
              <Section title={t('barberWorkSamples')} titleSize="lg" className="mb-6 mt-8">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
                  className="-mx-global px-global"
                >
                  {getMediaList(employee).map((item, index) => (
                    <Pressable
                      key={item.id ?? index}
                      onPress={() => setFullscreenMedia(item)}
                      className="rounded-xl overflow-hidden"
                      style={{ width: 160, height: 160 }}
                    >
                      {item.type === 'video' ? (
                        <VideoPlayer
                          uri={item.url}
                          style={{ width: 160, height: 160 }}
                          contentFit="cover"
                          shouldPlay
                          isMuted
                          isLooping
                        />
                      ) : (
                        <Image source={{ uri: item.url }} className="w-full h-full" resizeMode="cover" />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </Section>
            </>
          ) : null}

          {getBranchesList(employee).length > 0 ? (
            <>
              <Divider className="mb-4 mt-8" />
              <Section title={t('barberBranches')} titleSize="lg" className="mb-6 mt-2">
                <View className="mt-3 gap-3">
                  {getBranchesList(employee).map((branch: EmployeeBranch) => (
                    <Pressable
                      key={branch.id}
                      onPress={() => router.push(`/screens/branch-detail?id=${branch.id}`)}
                      className="flex-row items-center rounded-xl bg-light-secondary dark:bg-dark-secondary p-3"
                    >
                      {branch.imageUrl ? (
                        <Image source={{ uri: branch.imageUrl }} className="w-12 h-12 rounded-lg" resizeMode="cover" />
                      ) : (
                        <View className="w-12 h-12 rounded-lg bg-light-primary dark:bg-dark-primary" />
                      )}
                      <View className="flex-1 ml-3">
                        <ThemedText className="font-medium">{branch.name}</ThemedText>
                        {branch.address ? (
                          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext" numberOfLines={1}>
                            {branch.address}
                          </ThemedText>
                        ) : null}
                      </View>
                      <Icon name="ChevronRight" size={20} className="opacity-60" />
                    </Pressable>
                  ))}
                </View>
              </Section>
            </>
          ) : null}

          {getServicesList(employee).length > 0 ? (
            <>
              <Divider className="mb-4 mt-8" />
              <Section title={t('barberServices')} titleSize="lg" className="mb-6 mt-2">
                <View className="mt-3 gap-2">
                  {groupServicesByCategory(getServicesList(employee)).map((group) => {
                    const isExpanded = expandedCategoryId === group.categoryId;
                    return (
                      <View key={group.categoryId} className="rounded-xl overflow-hidden bg-light-secondary dark:bg-dark-secondary">
                        <Pressable
                          onPress={() => setExpandedCategoryId(isExpanded ? null : group.categoryId)}
                          className="flex-row items-center justify-between p-3"
                        >
                          <ThemedText className="font-medium">{group.categoryName}</ThemedText>
                          <Icon
                            name="ChevronDown"
                            size={20}
                            className={`opacity-60 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </Pressable>
                        {isExpanded ? (
                          <View className="gap-2 px-3 pb-3 pt-0">
                            {group.services.map((svc) => (
                              <View
                                key={svc.id}
                                className="flex-row items-center rounded-lg bg-light-primary dark:bg-dark-primary p-3"
                              >
                                {svc.imageUrl ? (
                                  <Image source={{ uri: svc.imageUrl }} className="w-12 h-12 rounded-lg" resizeMode="cover" />
                                ) : (
                                  <View className="w-12 h-12 rounded-lg bg-light-secondary dark:bg-dark-secondary" />
                                )}
                                <View className="flex-1 ml-3">
                                  <ThemedText className="font-medium text-sm">{svc.name}</ThemedText>
                                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                                    {svc.duration ?? '—'} min
                                  </ThemedText>
                                </View>
                                <ThemedText className="font-semibold text-sm">{svc.price != null ? `${svc.price} Kč` : '—'}</ThemedText>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </Section>
            </>
          ) : null}

          <View onLayout={(e: LayoutChangeEvent) => { reviewsSectionYInRoundedRef.current = e.nativeEvent.layout.y; }}>
            <Section
              title={t('profileReviews')}
              titleSize="lg"
              subtitle={`${displayTotal} ${t('branchReviews')}`}
              className="mb-6"
            >
            <View className="mt-4 bg-light-secondary dark:bg-dark-secondary p-4 rounded-lg">
              <View className="flex-row items-center mb-4">
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
            <View className="mt-6 flex-row items-center justify-between mb-3">
              <ThemedText className="font-semibold text-lg">{t('profileReviews')}</ThemedText>
              <Pressable
                onPress={() => router.push(`/screens/review?${reviewParams}`)}
                className="px-3 py-2 rounded-lg bg-light-secondary dark:bg-dark-secondary"
              >
                <ThemedText className="text-sm font-medium">{hasReviewed ? t('barberUpdateReview') : t('barberWriteReview')}</ThemedText>
              </Pressable>
            </View>
            {loadingReviews ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" />
                <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">{t('branchLoadingReviews')}</ThemedText>
              </View>
            ) : (
              <CardScroller className="mt-1" space={10}>
                {reviews.map((review) => {
                  const isOwnReview = client?.id != null && review.client?.id === client.id;
                  return (
                    <View key={review.id} className="w-[280px] bg-light-secondary dark:bg-dark-secondary p-4 rounded-lg">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center flex-1 min-w-0">
                          {review.isAnonymous ? (
                            <Image source={require('@/assets/img/wallet/realbarber.png')} className="w-10 h-10 rounded-full mr-2" resizeMode="cover" />
                          ) : review.client?.avatarUrl ? (
                            <Image source={{ uri: review.client.avatarUrl }} className="w-10 h-10 rounded-full mr-2" />
                          ) : (
                            <Avatar size="sm" name={review.client?.name ?? '?'} className="mr-2" />
                          )}
                          <View className="min-w-0">
                            <ThemedText className="font-medium" numberOfLines={1}>{review.isAnonymous ? 'Anonymous' : (review.client?.name ?? 'Anonymous')}</ThemedText>
                            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                              {formatReviewDate(review.createdAt)}
                            </ThemedText>
                          </View>
                        </View>
                        {isOwnReview && (
                          <View style={{ backgroundColor: colors.highlight }} className="ml-2 px-2 py-1 rounded-md">
                            <ThemedText className="text-xs font-medium text-white">{t('barberMine')}</ThemedText>
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
        className="flex-row items-center justify-start px-global pt-4 border-t border-neutral-200 dark:border-dark-secondary bg-light-primary dark:bg-dark-primary"
      >
        <View>
          <ThemedText className="text-xl font-bold">{t('barberBook')}</ThemedText>
          <ThemedText className="text-xs opacity-60">{t('barberReserveWith')}</ThemedText>
        </View>
        <View className="flex-row items-center ml-auto">
          <Button
            title={t('commonReserve')}
            variant="primary"
            className="ml-6 px-6"
            size="medium"
            rounded="lg"
            href={`/screens/reservation-create?employeeId=${encodeURIComponent(employee.id)}`}
          />
        </View>
      </View>

      <Modal
        visible={!!fullscreenMedia}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenMedia(null)}
      >
        <View style={{ flex: 1, width: winWidth, height: winHeight, backgroundColor: '#000' }}>
          <Pressable
            onPress={() => setFullscreenMedia(null)}
            style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 10, padding: 8 }}
            className="rounded-full bg-black/50"
          >
            <Icon name="X" size={24} className="text-white" />
          </Pressable>
          {fullscreenMedia?.type === 'video' ? (
            <VideoPlayer
              uri={fullscreenMedia.url}
              style={{ width: winWidth, height: winHeight }}
              contentFit="contain"
              nativeControls
              shouldPlay
            />
          ) : fullscreenMedia ? (
            <Pressable style={{ flex: 1 }} onPress={() => setFullscreenMedia(null)}>
              <Image
                source={{ uri: fullscreenMedia.url }}
                style={{ width: winWidth, height: winHeight }}
                resizeMode="contain"
              />
            </Pressable>
          ) : null}
        </View>
      </Modal>
    </>
  );
}
