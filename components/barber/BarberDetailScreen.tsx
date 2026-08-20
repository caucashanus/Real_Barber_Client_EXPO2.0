import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import React, { useCallback, useContext, useMemo, useRef } from 'react';
import {
  Animated,
  RefreshControl,
  View,
  ScrollView,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrollContext } from '@/app/(tabs)/(home)/_layout';
import type { TeamMemberMediaItem } from '@/api/publicTeamMember';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useBarberDetailScreen } from '@/hooks/useBarberDetailScreen';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import { OperatorCallUsSheet } from '@/components/OperatorSupportSheet';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import BranchContactActions from '@/components/branch/BranchContactActions';
import BarberCombinedProfileCard from '@/components/barber/BarberCombinedProfileCard';
import BarberIdentitySection from '@/components/barber/BarberIdentitySection';
import BarberTodaySlotsSection from '@/components/barber/BarberTodaySlotsSection';
import BarberReviewsSection from '@/components/barber/BarberReviewsSection';
import BarberShiftBranchesSection from '@/components/barber/BarberShiftBranchesSection';
import SiteBreadcrumbs from '@/components/shared/SiteBreadcrumbs';
import BarberStoriesSection from '@/components/barber/BarberStoriesSection';
import MediaFullscreenModal from '@/components/detail/MediaFullscreenModal';
import { buildEmployeeShareCopy } from '@/utils/branchShareHelpers';
import {
  getTeamMemberProfileShareUrl,
} from '@/utils/teamMemberPageHelpers';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';
import { teamMemberBreadcrumbItems } from '@/utils/breadcrumbs';
import { showIsNew } from '@/utils/crmIsNew';

export default function BarberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { accentColor } = useAccentColor();
  const scrollY = useContext(ScrollContext);
  const insets = useSafeAreaInsets();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const isMobileHeader = winWidth < 768;

  const {
    employee,
    loading,
    refreshing,
    refresh,
    error,
    displayName,
    bio,
    nearestSlotDayGroups,
    todayShiftStatus,
    shiftCalendarConfigured,
    today,
    shiftBranches,
    showNearestSlotsSection,
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
  const reviewsSectionYRef = useRef(0);
  const profileCardYRef = useRef(0);
  const availabilityInCardYRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      scrollY.setValue(0);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [scrollY])
  );

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
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        {!isMobileHeader ? <Header showBackButton /> : null}
        <View className="flex-1 items-center justify-center p-6">
          <ThemedText className="text-center text-amber-700 dark:text-amber-300">
            {error ?? t('barberNotFound')}
          </ThemedText>
        </View>
      </View>
    );
  }

  if (!employee) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        {!isMobileHeader ? <Header showBackButton /> : null}
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
            useNativeDriver: false,
          })}
          scrollEventThrottle={16}>
          <View className={isMobileHeader ? 'mt-4 px-global pb-8' : 'p-global pb-8'}>
          <SiteBreadcrumbs
            items={breadcrumbItems}
            accessibilityLabel={t('breadcrumbNavLabel')}
          />
          <View className={BARBER_DETAIL_SECTION_SPACING}>
            <BarberIdentitySection
              employeeId={employee.id}
              displayName={displayName}
              avatarUrl={employee.avatarUrl}
              average={average}
              locale={locale}
              languages={employee.languages}
              shiftStatus={todayShiftStatus}
              shareUrl={profileShareUrl}
              shareTitle={employeeShareCopy.title}
              shareEmailSubject={employeeShareCopy.emailSubject}
              shareEmailBody={employeeShareCopy.emailBody}
              onScrollToReviews={scrollToReviews}
              isNew={showIsNew(employee)}
              t={t}
            />
          </View>

          {showNearestSlotsSection ? (
            <BarberTodaySlotsSection
              employeeId={employee.id}
              employeeName={displayName}
              branches={branches}
              locale={locale}
              dayGroups={nearestSlotDayGroups}
              today={today}
              t={t}
            />
          ) : null}

          <BranchContactActions
            contactName={displayName}
            bookingHref={`/screens/reservation-create?employeeId=${encodeURIComponent(employee.id)}`}
            availabilityMessageKey="barberAvailabilityMessage"
            t={t}
          />

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
        </ThemeScroller>
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
