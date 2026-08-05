import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useBranchDetailScreen } from '@/hooks/useBranchDetailScreen';
import { useTranslation } from '@/hooks/useTranslation';
import { BranchNavigateSheet } from '@/components/BranchNavigateSheet';
import { OperatorCallUsSheet } from '@/components/OperatorSupportSheet';
import Header from '@/components/Header';
import BranchContentCard from '@/components/branch/BranchContentCard';
import BranchAboutSection from '@/components/branch/BranchAboutSection';
import BranchContactActions from '@/components/branch/BranchContactActions';
import BranchContactSection from '@/components/branch/BranchContactSection';
import BranchDirectionsSection from '@/components/branch/BranchDirectionsSection';
import BranchDirectionsVideoSection from '@/components/branch/BranchDirectionsVideoSection';
import BranchHomeSlotsSection from '@/components/branch/BranchHomeSlotsSection';
import BranchIdentitySection from '@/components/branch/BranchIdentitySection';
import BranchInteriorSection from '@/components/branch/BranchInteriorSection';
import BranchManagerSection from '@/components/branch/BranchManagerSection';
import BranchOtherBranches from '@/components/branch/BranchOtherBranches';
import BranchParkingSection from '@/components/branch/BranchParkingSection';
import BranchRatingModal from '@/components/branch/BranchRatingModal';
import BranchReviewsSection from '@/components/branch/BranchReviewsSection';
import BranchStickyBar, {
  BRANCH_DETAIL_HEADER_HEIGHT,
} from '@/components/branch/BranchStickyBar';
import BranchTeamSection from '@/components/branch/BranchTeamSection';
import BranchVirtualTourSection from '@/components/branch/BranchVirtualTourSection';
import SiteBreadcrumbs from '@/components/shared/SiteBreadcrumbs';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { getBranchContactMeta, getBranchBrandTitle, getBranchStickyTitle } from '@/constants/branchContacts';
import { getBranchInteriorCarouselImages } from '@/constants/branchInteriorGallery';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import { getBranchPageContent } from '@/constants/branchPageContent';
import { BARBER_DETAIL_SECTION_SPACING, getBranchDetailMapSize } from '@/constants/barberDetailLayout';
import {
  buildBranchReviewParams,
  getEmployeesList,
  getVrTourUrl,
  stripDescriptionPrefix,
} from '@/utils/branchDetailHelpers';
import { getBranchDirectionsVideoUrl } from '@/utils/branchDetailVideoHelpers';
import {
  buildBranchBookingHref,
  buildBranchShareCopy,
  getBranchGoogleReviewUrlForCrmId,
  getBranchProfileShareUrl,
} from '@/utils/branchShareHelpers';
import { branchBreadcrumbItems } from '@/utils/breadcrumbs';

export default function BranchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { client } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const isMobileHeader = winWidth < 768;
  const branchMapSize = useMemo(() => getBranchDetailMapSize(winWidth), [winWidth]);

  const {
    branch,
    loading,
    error,
    reviews,
    loadingReviews,
    hasReviewed,
    ratingModalVisible,
    setRatingModalVisible,
    countByRating,
    average,
    displayTotal,
    internalBranchId,
    slotGroups,
    loadingSlots,
    locale,
  } = useBranchDetailScreen(id ?? '');

  const scrollRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<View>(null);
  const interiorSectionRef = useRef<View>(null);
  const branchNavigateRef = useRef<ActionSheetRef>(null);
  const callUsSheetRef = useRef<ActionSheetRef>(null);
  const pinSentinelYRef = useRef(0);
  const reviewsSectionYRef = useRef(0);
  const [stickyVisible, setStickyVisible] = useState(false);

  const handlePinThresholdLayout = useCallback((event: LayoutChangeEvent) => {
    pinSentinelYRef.current = event.nativeEvent.layout.y;
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    setStickyVisible(y >= pinSentinelYRef.current);
  }, []);

  const scrollToReviews = useCallback(() => {
    scrollRef.current?.scrollTo({ y: Math.max(0, reviewsSectionYRef.current - 16), animated: true });
  }, []);

  const scrollToInterior = useCallback(() => {
    const anchor = interiorSectionRef.current;
    const content = scrollContentRef.current;
    if (!anchor || !content) return;
    anchor.measureLayout(
      content,
      (_left, top) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, top - 16), animated: true });
      },
      () => {}
    );
  }, []);

  const branchShareUrl = useMemo(
    () => (branch ? getBranchProfileShareUrl(branch, locale) : ''),
    [branch, locale]
  );
  const branchMeta = useMemo(() => {
    if (internalBranchId) return getBranchContactMeta(internalBranchId);
    if (
      branch?.address &&
      branch.latitude != null &&
      branch.longitude != null
    ) {
      return {
        id: (internalBranchId ?? 'modrany') as BranchInternalId,
        shortLabel: branch.name,
        address: branch.address,
        latitude: branch.latitude,
        longitude: branch.longitude,
        carouselImage: getBranchContactMeta('modrany').carouselImage,
      };
    }
    return null;
  }, [branch, internalBranchId]);

  const branchBrandTitle = useMemo(
    () =>
      branchMeta
        ? getBranchBrandTitle(branchMeta.shortLabel)
        : (branch?.name ?? ''),
    [branchMeta, branch?.name]
  );
  const branchStickyTitle = useMemo(
    () =>
      branchMeta
        ? getBranchStickyTitle(branchMeta.shortLabel)
        : getBranchStickyTitle(branch?.name ?? ''),
    [branchMeta, branch?.name]
  );

  const branchShareCopy = useMemo(
    () =>
      branch
        ? buildBranchShareCopy(branchBrandTitle, branchShareUrl, locale)
        : { title: '', emailSubject: '', emailBody: '' },
    [branch, branchBrandTitle, branchShareUrl, locale]
  );
  const branchRateUrl = useMemo(
    () => (branch ? getBranchGoogleReviewUrlForCrmId(branch.id) : null),
    [branch]
  );
  const branchBookingHref = useMemo(
    () => (branch ? buildBranchBookingHref(branch.id) : ''),
    [branch]
  );
  const breadcrumbItems = useMemo(
    () => (branch ? branchBreadcrumbItems(branchBrandTitle, t) : []),
    [branch, branchBrandTitle, t]
  );

  const pageContent = useMemo(
    () => getBranchPageContent(internalBranchId),
    [internalBranchId]
  );

  const aboutParagraphs = useMemo(() => {
    const fromApi = branch?.description?.trim();
    if (fromApi) return [stripDescriptionPrefix(fromApi)];
    return pageContent?.aboutParagraphs ?? [];
  }, [branch?.description, pageContent?.aboutParagraphs]);

  const directionsVideoUrl = useMemo(() => {
    if (!branch) return null;
    return getBranchDirectionsVideoUrl(branch, pageContent?.directionsVideoUrl ?? null);
  }, [branch, pageContent?.directionsVideoUrl]);

  const vrTourUrl = useMemo(
    () => (branch ? getVrTourUrl(branch.name) : null),
    [branch]
  );

  const hasInteriorSection = useMemo(() => {
    if (!internalBranchId) return false;
    return getBranchInteriorCarouselImages(internalBranchId).length > 0;
  }, [internalBranchId]);

  if (!loading && (error || !branch)) {
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

  if (!branch || !branchMeta) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 bg-light-primary dark:bg-dark-primary" />
      </>
    );
  }

  const employeesList = getEmployeesList(branch);
  const reviewParams = buildBranchReviewParams(branch);
  const ratingLocale = locale.startsWith('cs') ? 'cs' : 'en';

  const showContentCard =
    aboutParagraphs.length > 0 ||
    employeesList.length > 0 ||
    pageContent != null ||
    directionsVideoUrl != null ||
    internalBranchId != null ||
    vrTourUrl != null;

  return (
    <>
      <StatusBar style="dark" />
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        {!isMobileHeader ? <Header showBackButton title="" /> : null}

        <BranchStickyBar
          visible={stickyVisible}
          branchName={branchStickyTitle}
          bookingHref={branchBookingHref}
          topInset={insets.top}
          t={t}
          onPhonePress={() => callUsSheetRef.current?.show()}
        />

        <ThemedScroller
          ref={scrollRef}
          className="flex-1 bg-light-primary px-0 dark:bg-dark-primary"
          onScroll={handleScroll}
          scrollEventThrottle={16}>
          <View
            ref={scrollContentRef}
            className={isMobileHeader ? 'px-global' : 'p-global pb-8'}
            style={
              isMobileHeader
                ? {
                    paddingTop: insets.top + BRANCH_DETAIL_HEADER_HEIGHT + 24,
                    paddingBottom: 16,
                  }
                : undefined
            }>
            <SiteBreadcrumbs
              items={breadcrumbItems}
              accessibilityLabel={t('breadcrumbNavLabel')}
            />

            <View className={BARBER_DETAIL_SECTION_SPACING}>
              <BranchIdentitySection
                branchId={branch.id}
                branchName={branchBrandTitle}
                internalBranchId={internalBranchId}
                average={average}
                locale={ratingLocale}
                shareUrl={branchShareUrl}
                shareTitle={branchShareCopy.title}
                shareEmailSubject={branchShareCopy.emailSubject}
                shareEmailBody={branchShareCopy.emailBody}
                rateUrl={branchRateUrl}
                bookingHref={branchBookingHref}
                onScrollToReviews={scrollToReviews}
                t={t}
              />
            </View>

            <BranchContactSection
              branchMeta={branchMeta}
              mapWidth={branchMapSize.width}
              mapHeight={branchMapSize.height}
              onScrollToInterior={hasInteriorSection ? scrollToInterior : undefined}
              onOpenNavigate={() => branchNavigateRef.current?.show()}
              onOpenCallUs={() => callUsSheetRef.current?.show()}
              t={t}
            />

            <View onLayout={handlePinThresholdLayout}>
              <BranchHomeSlotsSection
                slotGroups={slotGroups}
                loading={loadingSlots}
                t={t}
              />
            </View>

            <BranchContactActions
              branchName={branchBrandTitle}
              bookingHref={branchBookingHref}
              t={t}
            />

            <BranchOtherBranches currentInternalId={internalBranchId} t={t} />

            {showContentCard ? (
              <BranchContentCard>
                <BranchAboutSection paragraphs={aboutParagraphs} t={t} />

                <BranchTeamSection employees={employeesList} t={t} />

                {pageContent ? (
                  <BranchDirectionsSection
                    intro={pageContent.directionsIntro}
                    sections={pageContent.directionsSections}
                    t={t}
                  />
                ) : null}

                {directionsVideoUrl ? (
                  <BranchDirectionsVideoSection videoUrl={directionsVideoUrl} t={t} />
                ) : null}

                {internalBranchId ? (
                  <BranchInteriorSection
                    internalBranchId={internalBranchId}
                    t={t}
                    sectionRef={interiorSectionRef}
                  />
                ) : null}

                {vrTourUrl ? (
                  <BranchVirtualTourSection embedUrl={vrTourUrl} t={t} />
                ) : null}

                {pageContent?.parkingMapVimeoId ? (
                  <BranchParkingSection vimeoId={pageContent.parkingMapVimeoId} t={t} />
                ) : null}

                {pageContent ? (
                  <BranchManagerSection
                    title={pageContent.managerTitle}
                    paragraphs={pageContent.managerParagraphs}
                  />
                ) : null}
              </BranchContentCard>
            ) : null}

            <BranchReviewsSection
              reviews={reviews}
              loadingReviews={loadingReviews}
              hasReviewed={hasReviewed}
              reviewParams={reviewParams}
              countByRating={countByRating}
              average={average}
              displayTotal={displayTotal}
              clientId={client?.id}
              locale={locale}
              onLayout={(event) => {
                reviewsSectionYRef.current = event.nativeEvent.layout.y;
              }}
              onOpenRatingModal={() => setRatingModalVisible(true)}
              t={t}
            />
          </View>
        </ThemedScroller>
      </View>

      <BranchNavigateSheet
        ref={branchNavigateRef}
        branchName={branchStickyTitle}
        address={branchMeta.address}
        latitude={branchMeta.latitude}
        longitude={branchMeta.longitude}
      />

      <OperatorCallUsSheet ref={callUsSheetRef} />

      <BranchRatingModal
        visible={ratingModalVisible}
        countByRating={countByRating}
        average={average}
        displayTotal={displayTotal}
        onClose={() => setRatingModalVisible(false)}
        t={t}
      />
    </>
  );
}
