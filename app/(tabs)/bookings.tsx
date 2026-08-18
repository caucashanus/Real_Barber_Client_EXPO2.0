import { useFocusEffect } from "expo-router/react-navigation";
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Pressable,
  RefreshControl} from 'react-native';

import type { Booking } from '@/api/bookings';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingsBadgeContext';
import { useCollapsibleTitle } from '@/hooks/useCollapsibleTitle';
import { useTranslation } from '@/hooks/useTranslation';
import AppButton from '@/components/AppButton';
import AnimatedView from '@/components/AnimatedView';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import { CardScroller } from '@/components/CardScroller';
import Header, { HeaderOutlineIconButton } from '@/components/Header';
import LiveIndicator from '@/components/LiveIndicator';
import ShowRating from '@/components/ShowRating';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { buildReservationReviewContextQuery } from '@/utils/bookingDetailHelpers';
import {
  getBookingClientReviewRating,
  getBookingStartDate,
  getBookingUiStatusTranslationKey,
  isBookingCurrent,
  isBookingPast,
  isBookingUpcoming} from '@/utils/bookingHelpers';
import {
  countClientBookingsByFilter,
  filterClientBookings,
  normalizeClientBookingFilter,
  type ClientBookingFilter} from '@/utils/clientBookingsFilter';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';
import { shadowPresets } from '@/utils/useShadow';
import { intlLocaleTag } from '@/utils/intlLocaleTag';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';

function formatBookingDate(b: Booking, locale: string = 'en'): string {
  const d = new Date(b.date);
  const dateLocale = intlLocaleTag(locale);
  const day = d.getDate();
  const month = d.toLocaleString(dateLocale, { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}, ${b.slotStart}`;
}

function groupBookingsByYear(
  bookings: Booking[],
  options?: { upcomingFirst?: boolean }
): Record<string, Booking[]> {
  const byYear: Record<string, Booking[]> = {};
  const sorted = [...bookings].sort((a, b) => {
    const aCurrent = isBookingCurrent(a);
    const bCurrent = isBookingCurrent(b);
    if (aCurrent !== bCurrent) return aCurrent ? -1 : 1;
    if (options?.upcomingFirst) {
      const aUp = isBookingUpcoming(a);
      const bUp = isBookingUpcoming(b);
      if (aUp !== bUp) return aUp ? -1 : 1;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  for (const b of sorted) {
    const year = String(new Date(b.date).getFullYear());
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(b);
  }
  return byYear;
}

type CountdownParts =
  | { type: 'days'; days: number }
  | { type: 'hours'; hours: number; minutes: number }
  | { type: 'minutes'; minutes: number; seconds: number };

function getCountdownParts(target: Date): CountdownParts | null {
  const now = Date.now();
  const ms = target.getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  if (!Number.isFinite(totalMinutes)) return null;
  if (days >= 3) return { type: 'days', days };
  if (totalHours >= 1) return { type: 'hours', hours: totalHours, minutes: totalMinutes % 60 };
  const totalSeconds = Math.floor(ms / 1000);
  return { type: 'minutes', minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 };
}

const AnimatedNumber = ({ value, className }: { value: number; className?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  const countAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value === prevValue.current) return;
    const startValue = prevValue.current;
    prevValue.current = value;
    countAnim.setValue(0);
    const listener = countAnim.addListener(({ value: v }) => {
      setDisplayValue(Math.round(startValue + (value - startValue) * v));
    });
    Animated.timing(countAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    return () => {
      countAnim.removeListener(listener);
    };
  }, [value]);

  const safe = Number.isFinite(displayValue) ? displayValue : 0;
  return <ThemedText className={className}>{safe}</ThemedText>;
};

const CountdownDisplay = ({ target }: { target: Date }) => {
  const { t } = useTranslation();
  const [parts, setParts] = useState<CountdownParts | null>(() => getCountdownParts(target));

  useEffect(() => {
    const tick = () => setParts(getCountdownParts(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target.getTime()]);

  if (!parts) return null;

  const textClass = 'text-sm text-light-subtext dark:text-dark-subtext';

  if (parts.type === 'days') {
    return (
      <View className="flex-row items-center">
        <ThemedText className={textClass}>{t('tripsIn')} </ThemedText>
        <AnimatedNumber value={parts.days} className={textClass} />
        <ThemedText className={textClass}> {t('tripsDays')}</ThemedText>
      </View>
    );
  }
  if (parts.type === 'hours') {
    return (
      <View className="flex-row items-center">
        <ThemedText className={textClass}>{t('tripsIn')} </ThemedText>
        <AnimatedNumber value={parts.hours} className={textClass} />
        <ThemedText className={textClass}> {t('tripsHours')} </ThemedText>
        <AnimatedNumber value={parts.minutes} className={textClass} />
        <ThemedText className={textClass}> {t('tripsMinutes')}</ThemedText>
      </View>
    );
  }
  return (
    <View className="flex-row items-center">
      <AnimatedNumber value={parts.minutes} className={textClass} />
      <ThemedText className={textClass}> {t('tripsMinutes')} </ThemedText>
      <AnimatedNumber value={parts.seconds} className={textClass} />
      <ThemedText className={textClass}> {t('tripsSeconds')}</ThemedText>
    </View>
  );
};

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
    refreshIfStale: refreshBookingsIfStale} = useBookings();
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
    upcomingFirst: activeFilter === 'all' || activeFilter === 'without_cancelled'});
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

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
      <AnimatedView animation="scaleIn" className="flex-1">
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
                <AppButton
                  variant="choice"
                  size="sm"
                  selected={activeFilter === 'current'}
                  title={`${t('tripsFilterCurrent')} (${counts.current})`}
                  onPress={() => setSelectedFilter('current')}
                />
              ) : null}
              <AppButton
                variant="choice"
                size="sm"
                selected={activeFilter === 'all'}
                title={t('tripsFilterAll')}
                onPress={() => setSelectedFilter('all')}
              />
              {counts.upcoming > 0 ? (
                <AppButton
                  variant="choice"
                  size="sm"
                  selected={activeFilter === 'upcoming'}
                  title={`${t('tripsFilterUpcoming')} (${counts.upcoming})`}
                  onPress={() => setSelectedFilter('upcoming')}
                />
              ) : null}
              <AppButton
                variant="choice"
                size="sm"
                selected={activeFilter === 'past'}
                title={t('tripsFilterPast')}
                onPress={() => setSelectedFilter('past')}
              />
              <AppButton
                variant="choice"
                size="sm"
                selected={activeFilter === 'cancelled'}
                title={`${t('tripsFilterCancelled')} (${counts.cancelled})`}
                onPress={() => setSelectedFilter('cancelled')}
              />
              <AppButton
                variant="choice"
                size="sm"
                selected={activeFilter === 'without_cancelled'}
                title={`${t('tripsFilterWithoutCancelled')} (${counts.withoutCancelled})`}
                onPress={() => setSelectedFilter('without_cancelled')}
              />
              <AppButton
                variant="choice"
                size="sm"
                selected={activeFilter === 'rated'}
                title={`${t('tripsFilterRated')} (${counts.rated})`}
                onPress={() => setSelectedFilter('rated')}
              />
              <AppButton
                variant="choice"
                size="sm"
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
                  {index > 0 && <YearDivider year={year} />}
                  {byYear[year].map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      dateText={formatBookingDate(booking, locale)}
                      reviewRating={getBookingClientReviewRating(booking)}
                      onOpenReview={() => {
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
                      }}
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

const YearDivider = (props: { year: string }) => (
  <View className="mb-3 mt-1 w-full">
    <ThemedText className="text-xs font-medium uppercase tracking-wider text-light-subtext dark:text-dark-subtext">
      {props.year}
    </ThemedText>
  </View>
);

function isPastAndNotCancelled(booking: Booking): boolean {
  return isBookingPast(booking);
}

const BookingCard = (props: {
  booking: Booking;
  dateText: string;
  reviewRating?: number;
  onOpenReview?: () => void;
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { booking, dateText, reviewRating, onOpenReview } = props;
  const title = booking.item?.name ?? 'Booking';
  const couponUsages = booking.couponUsages ?? [];
  const hasCoupon = couponUsages.length > 0;
  const couponBagLabel = hasCoupon
    ? couponUsages[0]?.coupon?.name?.trim() || couponUsages[0]?.coupon?.code?.trim() || null
    : null;
  const isPast = isPastAndNotCancelled(booking);
  const isCurrent = isBookingCurrent(booking);
  const isUpcoming = isBookingUpcoming(booking);
  const hasReview = reviewRating != null && reviewRating >= 1;
  const isCancelled =
    (booking.status ?? '').toLowerCase() === 'cancelled' ||
    (booking.status ?? '').toLowerCase() === 'canceled';

  const statusLabel = t(getBookingUiStatusTranslationKey(booking));

  const getStatusPillClass = () => {
    if (isCancelled) return 'bg-red-100 dark:bg-red-900/30';
    if (isCurrent) return 'bg-green-100 dark:bg-green-900/30';
    if (isPast) return 'bg-neutral-100 dark:bg-neutral-800';
    return 'bg-neutral-100 dark:bg-neutral-800';
  };

  const getStatusTextClass = () => {
    if (isCancelled) return 'text-red-700 dark:text-red-300';
    if (isCurrent) return 'text-green-700 dark:text-green-300';
    if (isPast) return 'text-neutral-600 dark:text-neutral-400';
    return 'text-neutral-700 dark:text-neutral-300';
  };

  const cardOpacity = isCancelled ? 'opacity-70' : 'opacity-100';

  const goToDetail = () => router.push(`/screens/booking-detail?id=${booking.id}`);

  return (
    <View
      style={shadowPresets.card}
      className={`mt-4 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-light-primary dark:border-neutral-700 dark:bg-dark-primary ${cardOpacity}`}>
      <Pressable onPress={goToDetail} className="p-5" android_ripple={null}>
        <View className="min-w-0 flex-1">
          <View className="mb-4 flex-row items-center justify-between gap-3">
            <View className="flex-row items-center">
              <View className={`rounded-full px-2.5 py-1 ${getStatusPillClass()}`}>
                <ThemedText className={`text-xs font-semibold ${getStatusTextClass()}`}>
                  {statusLabel}
                </ThemedText>
              </View>
              {isCurrent && (
                <View className="ml-2">
                  <LiveIndicator />
                </View>
              )}
            </View>
            {isUpcoming && (
              <View className="shrink-0 rounded-full bg-light-secondary px-2.5 py-1 dark:bg-dark-secondary">
                <CountdownDisplay target={getBookingStartDate(booking)} />
              </View>
            )}
          </View>
          <View className="flex-row items-start gap-3">
            <View className="min-w-0 flex-1">
              <ThemedText className="text-lg font-semibold" numberOfLines={2}>
                {title}
              </ThemedText>
              <ThemedText className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext">
                {dateText}
              </ThemedText>
              {booking.branch?.name ? (
                <ThemedText
                  className="mt-1 text-xs text-light-subtext dark:text-dark-subtext"
                  numberOfLines={1}>
                  {booking.branch.name}
                </ThemedText>
              ) : null}
              {couponBagLabel ? (
                <View className="mt-1.5 max-w-full self-start rounded-full bg-light-secondary px-2.5 py-1 dark:bg-dark-secondary">
                  <ThemedText
                    className="text-xs font-semibold text-light-text dark:text-dark-text"
                    numberOfLines={1}>
                    {couponBagLabel}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <Avatar
              src={booking.employee?.avatarUrl ?? undefined}
              name={booking.employee?.name}
              size="md"
            />
          </View>
        </View>
      </Pressable>
      {!isCancelled && (
        <View className="flex-row rounded-b-2xl bg-light-secondary dark:bg-dark-secondary">
          {isCurrent ? (
            <Button
              variant="ghost"
              size="small"
              title="Zobrazit probíhající rezervaci"
              onPress={goToDetail}
              className="flex-1 rounded-none rounded-b-2xl px-0 py-3.5"
              textClassName="text-sm font-semibold text-green-600 dark:text-green-400"
            />
          ) : (
            <>
              <Button
                variant="ghost"
                size="small"
                title={t('tripsViewBooking')}
                onPress={goToDetail}
                className="flex-1 rounded-none rounded-bl-2xl px-0 py-3.5"
                textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
              />
              <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />
              {isPast && !hasReview ? (
                <Button
                  variant="ghost"
                  size="small"
                  title={t('tripsAddReview')}
                  onPress={onOpenReview}
                  className="flex-1 rounded-none rounded-br-2xl px-0 py-3.5"
                  textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                />
              ) : isPast && hasReview ? (
                <TouchableOpacity
                  onPress={onOpenReview}
                  activeOpacity={0.7}
                  className="flex-1 items-center justify-center rounded-br-2xl py-3.5">
                  <ShowRating rating={reviewRating!} size="sm" displayMode="stars" />
                </TouchableOpacity>
              ) : isUpcoming ? (
                <Button
                  variant="ghost"
                  size="small"
                  title={t('bookingDetailMoveButton')}
                  iconStart="Calendar"
                  iconSize={16}
                  onPress={() =>
                    router.push(`/screens/reschedule?id=${encodeURIComponent(booking.id)}`)
                  }
                  className="flex-1 rounded-none rounded-br-2xl px-0 py-3.5"
                  textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                />
              ) : (
                <Button
                  variant="ghost"
                  size="small"
                  title={t('tripsMessage')}
                  onPress={() => router.push('/screens/chat/user')}
                  className="flex-1 rounded-none rounded-br-2xl px-0 py-3.5"
                  textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                />
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default TripsScreen;
