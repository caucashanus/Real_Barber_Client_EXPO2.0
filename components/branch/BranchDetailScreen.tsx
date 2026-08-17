import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { ScrollContext } from '@/app/(tabs)/(home)/_layout';
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
import BranchReviewsSection from '@/components/branch/BranchReviewsSection';
import BranchTeamSection from '@/components/branch/BranchTeamSection';
import BranchVirtualTourSection from '@/components/branch/BranchVirtualTourSection';
import SiteBreadcrumbs from '@/components/shared/SiteBreadcrumbs';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { getBranchContactMeta, getBranchBrandTitle, getBranchStickyTitle } from '@/constants/branchContacts';
import { getBranchInteriorCarouselImages } from '@/constants/branchInteriorGallery';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import { getBranchPageContent } from '@/constants/branchPageContent';
import { BARBER_DETAIL_SECTION_SPACING, getBranchDetailMapSize } from '@/constants/barberDetailLayout';
import { BRANCH_DIRECTIONS_VIDEO_ENABLED } from '@/constants/branchPage';
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
import { showIsNew } from '@/utils/crmIsNew';

export default function BranchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { client } = useAuth();
  const { t } = useTranslation();
  const scrollY = useContext(ScrollContext);
  const { width: winWidth } = useWindowDimensions();
  const isMobileHeader = winWidth < 768;
  const branchMapSize = useMemo(() => getBranchDetailMapSize(winWidth), [winWidth]);

  const {
    branch,
    loading,
    error,
    reviews,
    reviewsPagination,
    hasReviewed,
    ownReviewIds,
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
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        {!isMobileHeader ? <Header showBackButton /> : null}
        <View className="flex-1 items-center justify-center p-6">
          <ThemedText className="text-center text-red-500 dark:text-red-400">
            {error ?? 'Branch not found'}
          </ThemedText>
        </View>
      </View>
    );
  }

  if (!branch || !branchMeta) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        {!isMobileHeader ? <Header showBackButton /> : null}
      </View>
    );
  }

  const employeesList = getEmployeesList(branch);
  const reviewParams = buildBranchReviewParams(branch);
  const ratingLocale = locale;

  const showDirectionsVideo =
    BRANCH_DIRECTIONS_VIDEO_ENABLED && directionsVideoUrl != null;

  const showContentCard =
    aboutParagraphs.length > 0 ||
    employeesList.length > 0 ||
    pageContent != null ||
    showDirectionsVideo ||
    internalBranchId != null ||
    vrTourUrl != null;

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
          <View
            ref={scrollContentRef}
            className={isMobileHeader ? 'mt-4 px-global pb-8' : 'p-global pb-8'}>
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
                isNew={showIsNew(branch)}
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

            <BranchHomeSlotsSection
              slotGroups={slotGroups}
              loading={loadingSlots}
              t={t}
            />

            <BranchContactActions
              contactName={branchBrandTitle}
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

                {showDirectionsVideo && directionsVideoUrl ? (
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
              hasReviewed={hasReviewed}
              reviewParams={reviewParams}
              displayTotal={displayTotal}
              clientId={client?.id}
              ownReviewIds={ownReviewIds}
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

      <BranchNavigateSheet
        ref={branchNavigateRef}
        branchName={branchStickyTitle}
        address={branchMeta.address}
        latitude={branchMeta.latitude}
        longitude={branchMeta.longitude}
      />

      <OperatorCallUsSheet ref={callUsSheetRef} />
    </>
  );
}
