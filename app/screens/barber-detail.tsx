import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Animated,
  ScrollView,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBarberDetailScreen } from '@/app/hooks/useBarberDetailScreen';
import { useTranslation } from '@/app/hooks/useTranslation';
import Favorite from '@/components/Favorite';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import BarberAboutSection from '@/components/barber/BarberAboutSection';
import BarberBookFooter from '@/components/barber/BarberBookFooter';
import BarberBranchesSection from '@/components/barber/BarberBranchesSection';
import BarberHeaderInfo from '@/components/barber/BarberHeaderInfo';
import BarberHeroCarousel from '@/components/barber/BarberHeroCarousel';
import BarberReviewsSection from '@/components/barber/BarberReviewsSection';
import BarberServicesSection from '@/components/barber/BarberServicesSection';
import BarberWorkSamplesSection from '@/components/barber/BarberWorkSamplesSection';
import MediaFullscreenModal from '@/components/detail/MediaFullscreenModal';
import Divider from '@/components/layout/Divider';
import {
  buildBarberReviewParams,
  employeeTopSlides,
  getBranchesList,
  getMediaList,
  getServicesList,
  groupServicesByCategory,
} from '@/utils/barberDetailHelpers';

export default function BarberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  const {
    employee,
    loading,
    error,
    description,
    reviews,
    loadingReviews,
    hasReviewed,
    ownReviewIds,
    expandedCategoryId,
    setExpandedCategoryId,
    fullscreenMedia,
    setFullscreenMedia,
    countByRating,
    average,
    displayTotal,
  } = useBarberDetailScreen(id ?? '');

  const scrollRef = useRef<ScrollView>(null);
  const heroScrollY = useRef(new Animated.Value(0)).current;
  const roundedViewYRef = useRef(0);
  const reviewsSectionYInRoundedRef = useRef(0);

  const scrollToReviews = useCallback(() => {
    const y = roundedViewYRef.current + reviewsSectionYInRoundedRef.current;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }, []);

  const topSlides = useMemo(() => (employee ? employeeTopSlides(employee) : []), [employee]);

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

  if (error || !employee) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary p-6 dark:bg-dark-primary">
          <ThemedText className="text-center text-red-500 dark:text-red-400">
            {error ?? 'Barber not found'}
          </ThemedText>
        </View>
      </>
    );
  }

  const reviewParams = buildBarberReviewParams(employee);
  const serviceGroups = groupServicesByCategory(getServicesList(employee));
  const rightComponents = employee.name
    ? [
        <Favorite
          key="fav"
          productName={employee.name}
          title={employee.name}
          entityType="employee"
          entityId={employee.id}
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
        <BarberHeroCarousel topSlides={topSlides} heroScrollY={heroScrollY} />

        <View
          style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
          className="-mt-[30px] bg-light-primary p-global dark:bg-dark-primary"
          onLayout={(e: LayoutChangeEvent) => {
            roundedViewYRef.current = e.nativeEvent.layout.y;
          }}>
          <BarberHeaderInfo
            name={employee.name}
            average={average}
            onScrollToReviews={scrollToReviews}
            t={t}
          />

          <BarberAboutSection
            avatarUrl={employee.avatarUrl}
            name={employee.name}
            description={description}
            t={t}
          />

          <BarberWorkSamplesSection
            media={getMediaList(employee)}
            onMediaPress={setFullscreenMedia}
            t={t}
          />

          <BarberBranchesSection branches={getBranchesList(employee)} t={t} />

          <BarberServicesSection
            groups={serviceGroups}
            expandedCategoryId={expandedCategoryId}
            onToggleCategory={(categoryId) =>
              setExpandedCategoryId(expandedCategoryId === categoryId ? null : categoryId)
            }
            t={t}
          />

          <BarberReviewsSection
            reviews={reviews}
            reviewsTotal={displayTotal}
            loadingReviews={loadingReviews}
            hasReviewed={hasReviewed}
            ownReviewIds={ownReviewIds}
            reviewParams={reviewParams}
            countByRating={countByRating}
            average={average}
            displayTotal={displayTotal}
            locale={locale}
            onLayout={(e) => {
              reviewsSectionYInRoundedRef.current = e.nativeEvent.layout.y;
            }}
            t={t}
          />

          <Divider className="my-4" />
        </View>
      </ThemedScroller>

      <BarberBookFooter employeeId={employee.id} bottomInset={insets.bottom} t={t} />

      <MediaFullscreenModal
        media={fullscreenMedia}
        winWidth={winWidth}
        winHeight={winHeight}
        topInset={insets.top}
        onClose={() => setFullscreenMedia(null)}
      />
    </>
  );
}
