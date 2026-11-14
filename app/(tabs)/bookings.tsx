import { useFocusEffect } from "expo-router/react-navigation";
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { View, RefreshControl } from 'react-native';

import type { Booking } from '@/api/bookings';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingsBadgeContext';
import { useCollapsibleTitle } from '@/hooks/useCollapsibleTitle';
import { useTranslation } from '@/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import { CardScroller } from '@/components/CardScroller';
import SlotTimePill from '@/components/SlotTimePill';
import Header, { HeaderOutlineIconButton } from '@/components/Header';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import BookingTripCard, { BookingTripYearDivider } from '@/components/trips/BookingTripCard';
import { buildReservationReviewContextQuery } from '@/utils/bookingDetailHelpers';
import { getBookingClientReviewRating } from '@/utils/bookingHelpers';
import {
  countClientBookingsByFilter,
  filterClientBookings,
  normalizeClientBookingFilter,
  type ClientBookingFilter,
} from '@/utils/clientBookingsFilter';
import {
  formatBookingListDate,
  groupBookingsByYear,
  sortBookingYearsDesc,
} from '@/utils/clientBookingsList';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';

function openBookingReview(
  router: ReturnType<typeof useRouter>,
  booking: Booking
) {
  const imageParam = booking.item?.imageUrl
    ? `&entityImage=${encodeURIComponent(booking.item.imageUrl)}`
    : '';
  const employeeNameParam = booking.employee?.name
    ? `&entityEmployeeName=${encodeURIComponent(booking.employee.name)}`
    : '';
  const employeeAvatarParam = booking.employee?.avatarUrl
    ? `&entityEmployeeAvatar=${encodeURIComponent(booking.employee.avatarUrl)}`
    : '';
  router.push(
    `/screens/review?entityType=reservation&entityId=${encodeURIComponent(booking.id)}&entityName=${encodeURIComponent(booking.item?.name ?? 'Booking')}${imageParam}${employeeNameParam}${employeeAvatarParam}${buildReservationReviewContextQuery(booking)}`
  );
}

const TripsScreen = () => {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { accentColor } = useAccentColor();
  const { scrollY, scrollHandler, scrollEventThrottle } = useCollapsibleTitle();
  const { apiToken } = useAuth();
  const {
    bookings,
    loading,
    refresh: refreshBookings,
    refreshIfStale: refreshBookingsIfStale,
  } = useBookings();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<ClientBookingFilter>('all');
  const counts = countClientBookingsByFilter(bookings);
  const activeFilter = normalizeClientBookingFilter(selectedFilter, counts);

  useEffect(() => {
    if (activeFilter !== selectedFilter) {
      setSelectedFilter(activeFilter);
    }
  }, [activeFilter, selectedFilter]);

  const filteredBookings = filterClientBookings(bookings, activeFilter);

  const onRefresh = useCallback(async () => {
    if (!apiToken) return;
    setRefreshing(true);
    setError(null);
    try {
      await refreshBookings({ force: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setRefreshing(false);
    }
  }, [apiToken, refreshBookings]);

  useFocusEffect(
    useCallback(() => {
      if (!apiToken) return;
      refreshBookingsIfStale();
    }, [apiToken, refreshBookingsIfStale])
  );

  const byYear = groupBookingsByYear(filteredBookings, {
    upcomingFirst: activeFilter === 'all',
  });
  const years = sortBookingYearsDesc(Object.keys(byYear));

  const handleNewBooking = useCallback(async () => {
    const skip = await isReservationIntroCooldownActive();
    router.push(skip ? '/screens/reservation-create' : '/screens/reservation-create-start');
  }, [router]);

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header
        title={t('tripsTitle')}
        variant="collapsibleTitle"
        scrollY={scrollY}
        collapsibleTitleExpandedFontSize={36}
        collapsibleTitleCollapsedFontSize={20}
        rightComponents={[
          <HeaderOutlineIconButton
            key="add-booking"
            icon="Plus"
            accessibilityLabel={t('commonReserve')}
            onPress={() => void handleNewBooking()}
          />,
        ]}
      />
      <AnimatedView animation="scaleIn" playOnlyOnce className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <SiteLoadingSpinner />
            <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
              {t('tripsLoading')}
            </ThemedText>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-6">
            <ThemedText className="text-center text-red-500 dark:text-red-400">{error}</ThemedText>
          </View>
        ) : (
          <ThemeScroller
            className="px-global pt-4"
            onScroll={scrollHandler}
            scrollEventThrottle={scrollEventThrottle}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={accentColor}
              />
            }>
            <CardScroller className="mb-4" space={8}>
              {counts.current > 0 ? (
                <SlotTimePill
                  selected={activeFilter === 'current'}
                  title={`${t('tripsFilterCurrent')} (${counts.current})`}
                  onPress={() => setSelectedFilter('current')}
                />
              ) : null}
              <SlotTimePill
                selected={activeFilter === 'all'}
                title={t('tripsFilterAll')}
                onPress={() => setSelectedFilter('all')}
              />
              {counts.upcoming > 0 ? (
                <SlotTimePill
                  selected={activeFilter === 'upcoming'}
                  title={`${t('tripsFilterUpcoming')} (${counts.upcoming})`}
                  onPress={() => setSelectedFilter('upcoming')}
                />
              ) : null}
              <SlotTimePill
                selected={activeFilter === 'past'}
                title={t('tripsFilterPast')}
                onPress={() => setSelectedFilter('past')}
              />
              <SlotTimePill
                selected={activeFilter === 'cancelled'}
                title={`${t('tripsFilterCancelled')} (${counts.cancelled})`}
                onPress={() => setSelectedFilter('cancelled')}
              />
              <SlotTimePill
                selected={activeFilter === 'rated'}
                title={`${t('tripsFilterRated')} (${counts.rated})`}
                onPress={() => setSelectedFilter('rated')}
              />
              <SlotTimePill
                selected={activeFilter === 'pending_review'}
                title={`${t('tripsFilterPendingReview')} (${counts.pendingReview})`}
                onPress={() => setSelectedFilter('pending_review')}
              />
            </CardScroller>
            {years.length === 0 ? (
              <ThemedText className="py-8 text-center text-light-subtext dark:text-dark-subtext">
                {t('tripsNoBookings')}
              </ThemedText>
            ) : (
              years.map((year, index) => (
                <View key={year}>
                  {index > 0 ? <BookingTripYearDivider year={year} /> : null}
                  {byYear[year].map((booking) => (
                    <BookingTripCard
                      key={booking.id}
                      booking={booking}
                      dateText={formatBookingListDate(booking, locale)}
                      reviewRating={getBookingClientReviewRating(booking)}
                      onOpenReview={() => openBookingReview(router, booking)}
                    />
                  ))}
                </View>
              ))
            )}
          </ThemeScroller>
        )}
      </AnimatedView>
    </View>
  );
};

export default TripsScreen;