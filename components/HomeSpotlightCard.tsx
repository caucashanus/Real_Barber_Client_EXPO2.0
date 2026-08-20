import { router } from 'expo-router';
import React, { useRef } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { type ActionSheetRef } from 'react-native-actions-sheet';

import { useTheme } from '@/contexts/ThemeContext';
import AppButton from '@/components/AppButton';
import Avatar from '@/components/Avatar';
import { BranchNavigateSheet } from '@/components/BranchNavigateSheet';
import { ReservationShareSheet } from '@/components/booking/ReservationShareSheet';
import BranchAddress from '@/components/shared/BranchAddress';
import Icon from '@/components/Icon';
import LiveIndicator from '@/components/LiveIndicator';
import ThemedText from '@/components/ThemedText';
import SurfaceCard from '@/components/layout/SurfaceCard';
import type { TranslationKey } from '@/locales';
import { addBookingToCalendar } from '@/utils/bookingCalendar';
import {
  type HomeSpotlight,
  HOME_SPOTLIGHT_TITLE_KEY,
  formatHomeBookingSlotLabel,
  formatHomeSpotlightCountdown,
  getHomeSpotlightReviewPath,
  getHomeSpotlightReviewScreenPath,
} from '@/utils/homeSpotlight';
import { canShareClientBooking } from '@/utils/bookingHelpers';

const SPOTLIGHT_OUTLINE_BUTTON = {
  variant: 'outline' as const,
  size: 'sm' as const,
  rounded: 'full' as const,
  className: 'px-2.5 py-1',
  iconSize: 13,
  textClassName: 'text-xs font-semibold leading-tight',
};

function openBookingDetail(bookingId: string) {
  router.push(`/screens/booking-detail?id=${encodeURIComponent(bookingId)}` as never);
}

export function HomeSpotlightCard({
  spotlight,
  t,
  locale,
}: {
  spotlight: HomeSpotlight;
  t: (key: TranslationKey) => string;
  locale: string;
}) {
  const { booking, state, msUntilStart, existingReviewRating } = spotlight;
  const { isDark } = useTheme();
  const navSheetRef = useRef<ActionSheetRef>(null);
  const shareSheetRef = useRef<ActionSheetRef>(null);

  const titleKey: TranslationKey =
    state === 'review' && existingReviewRating != null
      ? 'homeSpotlightReviewRated'
      : HOME_SPOTLIGHT_TITLE_KEY[state];
  const subtitle = state === 'today' ? formatHomeSpotlightCountdown(msUntilStart, locale) : null;
  const starFilledColor = isDark ? '#fbbf24' : '#f59e0b';
  const starEmptyColor = isDark ? '#525252' : '#d4d4d4';

  const slotBadgeLabel =
    state === 'soon'
      ? formatHomeSpotlightCountdown(msUntilStart, locale)
      : formatHomeBookingSlotLabel(booking);

  const showSlotBadge = state !== 'review' && state !== 'current';
  const showNavigateAction = state === 'soon';
  const showCalendarAction =
    (state === 'upcoming' || state === 'today' || state === 'soon') &&
    (Platform.OS === 'ios' || Platform.OS === 'android');
  const showShareAction = state === 'current' && canShareClientBooking(booking);
  const showBottomActions = showSlotBadge;

  const openDetail = () => {
    if (state === 'review') {
      router.push(getHomeSpotlightReviewScreenPath(booking) as never);
      return;
    }
    openBookingDetail(booking.id);
  };

  const handleAddToCalendar = () => {
    addBookingToCalendar(booking, {
      noteBarberPrefix: t('bookingCalendarNoteBarber'),
      reservationNumberPrefix: t('bookingReservationNumber'),
      errorTitle: t('commonError'),
      errorMessage: t('bookingAddToCalendarFailed'),
    }).catch(() => {});
  };

  return (
    <>
      <View className="relative">
        <Pressable onPress={openDetail} accessibilityRole="button" className="active:opacity-70">
          <SurfaceCard rounded="2xl" className="flex-row overflow-hidden">
            <View className="min-w-0 flex-1">
              <View
                className={`flex-row items-center gap-3 px-4 py-4 ${showShareAction ? 'pr-36' : ''}`}>
                <Avatar
                  size="md"
                  src={booking.employee?.avatarUrl ?? undefined}
                  name={booking.employee?.name ?? undefined}
                />
                <View className="min-w-0 flex-1">
                  {state === 'review' ? (
                    <View>
                      <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                        {t(titleKey)}
                      </ThemedText>
                      <View className="mt-3 flex-row gap-1.5">
                        {([1, 2, 3, 4, 5] as const).map((rating) => {
                          const filled =
                            existingReviewRating != null && rating <= existingReviewRating;
                          return (
                            <Pressable
                              key={rating}
                              hitSlop={6}
                              onPress={(e) => {
                                e.stopPropagation?.();
                                router.push(getHomeSpotlightReviewPath(booking, rating) as never);
                              }}>
                              <Icon
                                name="Star"
                                size={30}
                                color={filled ? starFilledColor : starEmptyColor}
                                fill={filled ? starFilledColor : 'none'}
                                strokeWidth={filled ? 1.5 : 2}
                              />
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ) : (
                    <>
                      <View className="flex-row items-center gap-2">
                        <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                          {t(titleKey)}
                        </ThemedText>
                        <View className="shrink-0 justify-center">
                          <LiveIndicator
                            variant={state === 'current' ? 'green' : 'orange'}
                            size="sm"
                            animated={state === 'current'}
                          />
                        </View>
                      </View>
                      <ThemedText
                        className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext"
                        numberOfLines={1}>
                        {booking.employee?.name ?? '—'} · {booking.branch?.name ?? ''}
                      </ThemedText>
                      {subtitle ? (
                        <View className="mt-1.5 flex-row items-center gap-1.5">
                          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                            {subtitle}
                          </ThemedText>
                        </View>
                      ) : null}
                    </>
                  )}
                  {state !== 'review' && (
                    <BranchAddress
                      address={booking.branch?.address}
                      className="mt-1"
                      textClassName="text-xs leading-5 text-light-subtext dark:text-dark-subtext"
                      numberOfLines={2}
                    />
                  )}
                </View>
                {state !== 'soon' && !showShareAction ? (
                  <Icon
                    name="ChevronRight"
                    size={16}
                    className="shrink-0 text-light-subtext dark:text-dark-subtext"
                  />
                ) : null}
              </View>

              {showBottomActions ? (
                <View className="flex-row items-center justify-between gap-2 px-4 pb-4 pt-0">
                  <ThemedText
                    className="min-w-0 shrink text-xs font-semibold text-light-text dark:text-dark-text"
                    numberOfLines={1}>
                    {slotBadgeLabel}
                  </ThemedText>
                  <View className="min-w-0 shrink flex-row flex-wrap justify-end gap-2">
                    {showNavigateAction ? (
                      <AppButton
                        {...SPOTLIGHT_OUTLINE_BUTTON}
                        title={t('branchNavigateSectionTitle')}
                        iconStart="Navigation"
                        onPress={(event) => {
                          event?.stopPropagation?.();
                          navSheetRef.current?.show();
                        }}
                      />
                    ) : null}
                    {showCalendarAction ? (
                      <AppButton
                        {...SPOTLIGHT_OUTLINE_BUTTON}
                        title={t('bookingAddToCalendar')}
                        iconStart="CalendarPlus"
                        onPress={(event) => {
                          event?.stopPropagation?.();
                          handleAddToCalendar();
                        }}
                      />
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>
          </SurfaceCard>
        </Pressable>

        {showShareAction ? (
          <View className="absolute z-10" style={{ top: 12, right: 12 }}>
            <AppButton
              {...SPOTLIGHT_OUTLINE_BUTTON}
              title={t('bookingShareMyBookingButton')}
              iconStart="Share"
              onPress={() => shareSheetRef.current?.show()}
            />
          </View>
        ) : null}
      </View>

      {state === 'soon' && (
        <BranchNavigateSheet
          ref={navSheetRef}
          branchName={booking.branch?.name}
          address={booking.branch?.address}
        />
      )}

      {showShareAction ? <ReservationShareSheet ref={shareSheetRef} bookingId={booking.id} /> : null}
    </>
  );
}
