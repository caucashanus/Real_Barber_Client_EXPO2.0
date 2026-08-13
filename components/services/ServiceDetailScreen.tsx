import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';

import { ScrollContext } from '@/app/(tabs)/(home)/_layout';
import { useServiceDetailScreen } from '@/hooks/useServiceDetailScreen';
import { useTranslation } from '@/hooks/useTranslation';
import BranchContactActions from '@/components/branch/BranchContactActions';
import BranchHomeSlotsSection from '@/components/branch/BranchHomeSlotsSection';
import CustomCard from '@/components/CustomCard';
import Header from '@/components/Header';
import ImageCarousel from '@/components/ImageCarousel';
import ServiceDetailIdentitySection from '@/components/services/ServiceDetailIdentitySection';
import SiteBreadcrumbs from '@/components/shared/SiteBreadcrumbs';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';
import { serviceBreadcrumbItems } from '@/utils/breadcrumbs';
import { startHairstyleSlotHandoffBooking } from '@/utils/hairstyleSlotHandoff';
import { buildServiceBookingHref } from '@/utils/serviceDetailHelpers';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const scrollY = useContext(ScrollContext);
  const { width: winWidth } = useWindowDimensions();
  const isMobileHeader = winWidth < 768;

  const { detail, loading, error, slotGroups, locale, todayIso } = useServiceDetailScreen(id ?? '');

  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollY.setValue(0);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [scrollY])
  );

  const heroSlides = useMemo(
    () => (detail ? detail.heroSlides.map((slide) => slide.src).filter(Boolean) : []),
    [detail]
  );

  const carouselWidth = winWidth - 48;
  const carouselHeight = Math.round(carouselWidth * 1.5);

  const bookingHref = detail ? buildServiceBookingHref(detail.id, detail.title) : '';

  const shareCopy = useMemo(
    () => ({
      title: detail?.title ?? '',
      emailSubject: detail?.title ?? '',
      emailBody: detail?.webUrl ?? '',
      shareUrl: detail?.webUrl ?? '',
    }),
    [detail]
  );

  const breadcrumbItems = useMemo(
    () => (detail ? serviceBreadcrumbItems(detail.title, t) : []),
    [detail, t]
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!detail || error) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        {!isMobileHeader ? <Header showBackButton /> : null}
        <View className="flex-1 items-center justify-center p-6">
          <ThemedText className="text-center text-amber-700 dark:text-amber-300">
            {t('serviceDetailNotFound')}
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
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={16}>
          <View className={isMobileHeader ? 'mt-4 px-global pb-8' : 'p-global pb-8'}>
            <SiteBreadcrumbs
              items={breadcrumbItems}
              accessibilityLabel={t('breadcrumbNavLabel')}
            />
            <View className={BARBER_DETAIL_SECTION_SPACING}>
              <ServiceDetailIdentitySection
                itemId={detail.id}
                title={detail.title}
                shareUrl={shareCopy.shareUrl}
                shareTitle={shareCopy.title}
                shareEmailSubject={shareCopy.emailSubject}
                shareEmailBody={shareCopy.emailBody}
                bookingHref={bookingHref}
                t={t}
              />
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
                    slot,
                  }).catch(() => {});
                }}
              />
            ) : null}

            <BranchContactActions
              contactName={detail.title}
              bookingHref={bookingHref}
              availabilityMessageKey="serviceChooseBranchBarber"
              t={t}
            />

            <CustomCard
              rounded="2xl"
              padding="md"
              border
              background={false}
              className={`${BARBER_DETAIL_SECTION_SPACING} bg-light-secondary dark:bg-dark-secondary`}>
              <ThemedText className="text-lg font-semibold">{t('serviceAbout')}</ThemedText>
              <ThemedText className="mt-3 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
                {detail.description?.trim() || '—'}
              </ThemedText>
            </CustomCard>
          </View>
        </ThemeScroller>
      </View>
    </>
  );
}
