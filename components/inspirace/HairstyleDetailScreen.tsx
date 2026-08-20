import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import React, { useCallback, useContext, useMemo, useRef } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
  type LayoutChangeEvent} from 'react-native';

import { ScrollContext } from '@/app/(tabs)/(home)/_layout';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useHairstyleDetailScreen } from '@/hooks/useHairstyleDetailScreen';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import ImageCarousel from '@/components/ImageCarousel';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import BranchContactActions from '@/components/branch/BranchContactActions';
import BranchHomeSlotsSection from '@/components/branch/BranchHomeSlotsSection';
import BarberReviewsSection from '@/components/barber/BarberReviewsSection';
import HairstyleDetailContentCard from '@/components/inspirace/HairstyleDetailContentCard';
import HairstyleIdentityMetaRow from '@/components/inspirace/HairstyleIdentityMetaRow';
import HairstyleIdentitySection from '@/components/inspirace/HairstyleIdentitySection';
import HairstyleSimilarSection from '@/components/inspirace/HairstyleSimilarSection';
import SiteBreadcrumbs from '@/components/shared/SiteBreadcrumbs';
import InspiraceServiceGallery from '@/components/inspirace/InspiraceServiceGallery';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';
import {
  buildHairstyleBookingHref} from '@/utils/inspiraceServiceDetailHelpers';
import { startHairstyleSlotHandoffBooking } from '@/utils/hairstyleSlotHandoff';
import { hairstyleBreadcrumbItems } from '@/utils/breadcrumbs';
import SiteLoadingState from '@/components/SiteLoadingState';

export default function HairstyleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { accentColor } = useAccentColor();
  const scrollY = useContext(ScrollContext);
  const { width: winWidth } = useWindowDimensions();
  const isMobileHeader = winWidth < 768;

  const {
    detail,
    loading,
    refreshing,
    refresh,
    error,
    reviews,
    reviewsPagination,
    hasReviewed,
    ownReviewIds,
    reviewParams,
    displayTotal,
    slotGroups,
    locale,
    todayIso} = useHairstyleDetailScreen(id ?? '');

  const scrollRef = useRef<ScrollView>(null);
  const reviewsSectionYRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      scrollY.setValue(0);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [scrollY])
  );

  const scrollToReviews = useCallback(() => {
    scrollRef.current?.scrollTo({ y: Math.max(0, reviewsSectionYRef.current - 16), animated: true });
  }, []);

  const heroSlides = useMemo(() => {
    if (!detail) return [] as string[];
    return detail.heroSlides.map((slide) => slide.src).filter(Boolean);
  }, [detail]);

  const carouselWidth = winWidth - 48;
  const carouselHeight = Math.round(carouselWidth * 1.5);

  const bookingHref = detail ? buildHairstyleBookingHref(detail.id, detail.title) : '';

  const shareCopy = useMemo(
    () => ({
      title: detail?.title ?? '',
      emailSubject: detail?.title ?? '',
      emailBody: detail?.webUrl ?? ''}),
    [detail]
  );

  const breadcrumbItems = useMemo(
    () => hairstyleBreadcrumbItems(detail?.title ?? '', t),
    [detail?.title, t]
  );

  if (loading) {
    return (
      <SiteLoadingState layout="section" />
    );
  }

  if (!detail || error) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        {!isMobileHeader ? <Header showBackButton /> : null}
        <View className="flex-1 items-center justify-center p-6">
          <ThemedText className="text-center text-amber-700 dark:text-amber-300">
            {t('inspiraceDetailNotFound')}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <>
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        {!isMobileHeader ? <Header showBackButton title="" /> : null}

        <ThemeScroller
          ref={scrollRef}
          className="px-0"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={accentColor} />
          }
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: false})}
          scrollEventThrottle={16}>
          <View className={isMobileHeader ? 'mt-4 px-global pb-8' : 'p-global pb-8'}>
            <SiteBreadcrumbs
              items={breadcrumbItems}
              accessibilityLabel={t('breadcrumbNavLabel')}
            />
            <View className={BARBER_DETAIL_SECTION_SPACING}>
              <HairstyleIdentitySection
                serviceId={detail.id}
                title={detail.title}
                shareUrl={detail.webUrl ?? ''}
                shareTitle={shareCopy.title}
                shareEmailSubject={shareCopy.emailSubject}
                shareEmailBody={shareCopy.emailBody}
                bookingHref={bookingHref}
                onScrollToReviews={scrollToReviews}
                t={t}
              />
              {detail.aboutBadge || detail.popularityBadge || detail.isNew ? (
                <View style={{ marginTop: 12 }}>
                  <HairstyleIdentityMetaRow
                    aboutBadge={detail.aboutBadge}
                    popularityBadge={detail.popularityBadge}
                    isNew={detail.isNew}
                    t={t}
                  />
                </View>
              ) : null}
            </View>

            {heroSlides.length > 0 ? (
              <View className={`${BARBER_DETAIL_SECTION_SPACING} overflow-hidden rounded-2xl`}>
                <ImageCarousel
                  images={heroSlides}
                  width={carouselWidth}
                  height={carouselHeight}
                  showPagination={heroSlides.length > 1}
                  paginationPlacement="overlay"
                  autoPlay={heroSlides.length > 1}
                  autoPlayInterval={3000}
                  loop
                  rounded="2xl"
                />
              </View>
            ) : null}

            {slotGroups.length > 0 ? (
              <BranchHomeSlotsSection
                slotGroups={slotGroups}
                t={t}
                locale={locale}
                todayIso={todayIso}
                groupByBranch
                onSlotPress={(slot) => {
                  void startHairstyleSlotHandoffBooking({
                    serviceId: detail.id,
                    serviceName: detail.title,
                    slot}).catch(() => {});
                }}
              />
            ) : null}

            <BranchContactActions
              contactName={detail.title}
              bookingHref={bookingHref}
              availabilityMessageKey="inspiraceDetailAvailabilityMessage"
              t={t}
            />

            <HairstyleDetailContentCard detail={detail} t={t} />

            <View className={BARBER_DETAIL_SECTION_SPACING}>
              <InspiraceServiceGallery images={detail.galleryImages} t={t} />
            </View>

            <HairstyleSimilarSection items={detail.similarHairstyles} t={t} />

            <BarberReviewsSection
              reviews={reviews}
              hasReviewed={hasReviewed}
              ownReviewIds={ownReviewIds}
              reviewParams={reviewParams}
              displayTotal={displayTotal}
              locale={locale}
              showPagination={reviewsPagination.showPagination}
              reviewsLoading={reviewsPagination.loading}
              reviewsError={reviewsPagination.error}
              canGoPrevious={reviewsPagination.canGoPrevious}
              canGoNext={reviewsPagination.canGoNext}
              onPrevious={reviewsPagination.goPrevious}
              onNext={reviewsPagination.goNext}
              onLayout={(event) => {
                reviewsSectionYRef.current = event.nativeEvent.layout.y;
              }}
              t={t}
            />
          </View>
        </ThemeScroller>
      </View>
    </>
  );
}
