import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TeamMemberMediaItem } from '@/api/publicTeamMember';
import { useBarberDetailScreen } from '@/hooks/useBarberDetailScreen';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import { OperatorCallUsSheet } from '@/components/OperatorSupportSheet';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import BarberBookFooter from '@/components/barber/BarberBookFooter';
import BarberCombinedProfileCard from '@/components/barber/BarberCombinedProfileCard';
import BarberIdentitySection from '@/components/barber/BarberIdentitySection';
import BarberTodaySlotsSection from '@/components/barber/BarberTodaySlotsSection';
import BarberReviewsSection from '@/components/barber/BarberReviewsSection';
import BarberShiftBranchesSection from '@/components/barber/BarberShiftBranchesSection';
import BarberStickyBar, {
  BARBER_DETAIL_HEADER_HEIGHT,
} from '@/components/barber/BarberStickyBar';
import SiteBreadcrumbs from '@/components/shared/SiteBreadcrumbs';
import BarberStoriesSection from '@/components/barber/BarberStoriesSection';
import MediaFullscreenModal from '@/components/detail/MediaFullscreenModal';
import { buildEmployeeShareCopy } from '@/utils/branchShareHelpers';
import {
  getTeamMemberProfileShareUrl,
  getTodayActiveWaitlistBranchId,
} from '@/utils/teamMemberPageHelpers';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';
import { teamMemberBreadcrumbItems } from '@/utils/breadcrumbs';

const AVATAR_XL_HEIGHT = 80;

export default function BarberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const isMobileHeader = winWidth < 768;

  const {
    employee,
    loading,
    error,
    displayName,
    bio,
    todaySlots,
    loadingSlots,
    todayShiftStatus,
    shiftCalendarConfigured,
    today,
    shiftBranches,
    showTodaySlotsSection,
    showAbout,
    showSkills,
    showMedia,
    showStoriesGallery,
    reviews,
    reviewsPagination,
    hasReviewed,
    ownReviewIds,
    reviewParams,
    average,
    displayTotal,
    locale,
    fullscreenMedia,
    setFullscreenMedia,
  } = useBarberDetailScreen(id ?? '');

  const scrollRef = useRef<ScrollView>(null);
  const callUsSheetRef = useRef<ActionSheetRef>(null);
  const pinSentinelYRef = useRef(0);
  const reviewsSectionYRef = useRef(0);
  const profileCardYRef = useRef(0);
  const availabilityInCardYRef = useRef(0);
  const [stickyVisible, setStickyVisible] = useState(false);

  const handlePinThresholdLayout = useCallback((event: LayoutChangeEvent) => {
    const { y } = event.nativeEvent.layout;
    pinSentinelYRef.current = y + AVATAR_XL_HEIGHT;
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    setStickyVisible(y >= pinSentinelYRef.current);
  }, []);

  const handleProfileCardLayout = useCallback((event: LayoutChangeEvent) => {
    profileCardYRef.current = event.nativeEvent.layout.y;
  }, []);

  const scrollToReviews = useCallback(() => {
    scrollRef.current?.scrollTo({ y: Math.max(0, reviewsSectionYRef.current - 16), animated: true });
  }, []);

  const scrollToAvailability = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, profileCardYRef.current + availabilityInCardYRef.current - 16),
      animated: true,
    });
  }, []);

  const handleAvailabilityLayout = useCallback((event: LayoutChangeEvent) => {
    availabilityInCardYRef.current = event.nativeEvent.layout.y;
  }, []);

  const mediaItems = useMemo(() => employee?.media ?? [], [employee?.media]);
  const shiftCalendar = useMemo(() => employee?.shiftCalendar, [employee?.shiftCalendar]);
  const stories = useMemo(() => employee?.stories ?? [], [employee?.stories]);
  const branches = useMemo(() => employee?.branches ?? [], [employee?.branches]);
  const waitlistBranchId = useMemo(
    () => getTodayActiveWaitlistBranchId(shiftCalendar, today),
    [shiftCalendar, today]
  );

  const fullscreenEmployeeMedia = useMemo(() => {
    if (!fullscreenMedia) return null;
    return {
      url: fullscreenMedia.url,
      type: (fullscreenMedia.type === 'video' ? 'video' : 'image') as 'image' | 'video',
    };
  }, [fullscreenMedia]);

  const profileShareUrl = useMemo(
    () => (employee ? getTeamMemberProfileShareUrl(employee, locale) : ''),
    [employee, locale]
  );

  const employeeShareCopy = useMemo(
    () =>
      employee
        ? buildEmployeeShareCopy(displayName, profileShareUrl, locale)
        : { title: '', emailSubject: '', emailBody: '' },
    [displayName, employee, locale, profileShareUrl]
  );
  const breadcrumbItems = useMemo(
    () => teamMemberBreadcrumbItems(displayName, t),
    [displayName, t]
  );

  if (!loading && (error || !employee)) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary p-6 dark:bg-dark-primary">
          <ThemedText className="text-center text-amber-700 dark:text-amber-300">
            {error ?? t('barberNotFound')}
          </ThemedText>
        </View>
      </>
    );
  }

  if (!employee) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 bg-light-primary dark:bg-dark-primary" />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        {!isMobileHeader ? <Header showBackButton title="" /> : null}
        <BarberStickyBar
          visible={stickyVisible}
          displayName={displayName}
          employeeId={employee.id}
          shiftStatus={todayShiftStatus}
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
            className={isMobileHeader ? 'px-global' : 'p-global pb-8'}
            style={
              isMobileHeader
                ? {
                    paddingTop: insets.top + BARBER_DETAIL_HEADER_HEIGHT + 24,
                    paddingBottom: 16,
                  }
                : undefined
            }>
          <SiteBreadcrumbs
            items={breadcrumbItems}
            accessibilityLabel={t('breadcrumbNavLabel')}
          />
          <View onLayout={handlePinThresholdLayout} className={BARBER_DETAIL_SECTION_SPACING}>
            <BarberIdentitySection
              employeeId={employee.id}
              displayName={displayName}
              avatarUrl={employee.avatarUrl}
              average={average}
              locale={locale.startsWith('cs') ? 'cs' : 'en'}
              languages={employee.languages}
              shiftStatus={todayShiftStatus}
              shareUrl={profileShareUrl}
              shareTitle={employeeShareCopy.title}
              shareEmailSubject={employeeShareCopy.emailSubject}
              shareEmailBody={employeeShareCopy.emailBody}
              onScrollToReviews={scrollToReviews}
              t={t}
            />
          </View>

          {showTodaySlotsSection ? (
            <BarberTodaySlotsSection
              employeeId={employee.id}
              employeeName={displayName}
              branches={branches}
              locale={locale}
              todaySlots={todaySlots}
              loadingSlots={loadingSlots}
              shiftStatus={todayShiftStatus}
              waitlistBranchId={waitlistBranchId}
              onScrollToAvailability={scrollToAvailability}
              t={t}
            />
          ) : null}

          <BarberShiftBranchesSection branches={shiftBranches} locale={locale} t={t} />

          {showStoriesGallery ? <BarberStoriesSection stories={stories} t={t} /> : null}

          <BarberCombinedProfileCard
            employee={employee}
            employeeId={employee.id}
            bio={bio}
            showAbout={showAbout}
            showSkills={showSkills}
            showMedia={showMedia}
            mediaItems={mediaItems}
            shiftCalendar={shiftCalendar}
            branches={branches}
            today={today}
            locale={locale}
            calendarConfigured={shiftCalendarConfigured}
            onMediaPress={(item: TeamMemberMediaItem) => setFullscreenMedia(item)}
            onLayout={handleProfileCardLayout}
            onAvailabilityLayout={handleAvailabilityLayout}
            onCollapseScroll={scrollToAvailability}
            t={t}
          />

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
            onLayout={(event: LayoutChangeEvent) => {
              reviewsSectionYRef.current = event.nativeEvent.layout.y;
            }}
            t={t}
          />
        </View>
        </ThemedScroller>
        <BarberBookFooter employeeId={employee.id} bottomInset={insets.bottom} t={t} />
      </View>

      <MediaFullscreenModal
        media={fullscreenEmployeeMedia}
        winWidth={winWidth}
        winHeight={winHeight}
        topInset={insets.top}
        onClose={() => setFullscreenMedia(null)}
      />

      <OperatorCallUsSheet ref={callUsSheetRef} />
    </>
  );
}
