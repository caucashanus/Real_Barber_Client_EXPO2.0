import { router } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { type ActionSheetRef } from 'react-native-actions-sheet';

import { useTheme } from '@/contexts/ThemeContext';
import AppButton from '@/components/AppButton';
import Avatar from '@/components/Avatar';
import { BranchNavigateSheet } from '@/components/BranchNavigateSheet';
import BookingCountdownPill from '@/components/booking/BookingCountdownPill';
import { ReservationShareSheet } from '@/components/booking/ReservationShareSheet';
import { OperatorCallUsSheet } from '@/components/OperatorSupportSheet';
import BranchAddress from '@/components/shared/BranchAddress';
import Icon from '@/components/Icon';
import LiveIndicator from '@/components/LiveIndicator';
import ThemedText from '@/components/ThemedText';
import SurfaceCard from '@/components/layout/SurfaceCard';
import type { TranslationKey } from '@/locales';
import { addBookingToCalendar } from '@/utils/bookingCalendar';
import { getBookingStartDate } from '@/utils/bookingHelpers';
import {
  resolveClientBookingSpotlightPresentation,
  spotlightPhaseTitleKey,
  spotlightStatusDotLiveVariant,
} from '@/utils/clientBookingSpotlightPresentation';
import {
  type HomeSpotlight,
  formatHomeBookingSlotLabel,
  formatHomeSpotlightCountdown,
  getHomeSpotlightReviewPath,
  getHomeSpotlightReviewScreenPath,
} from '@/utils/homeSpotlight';

/** Mezera titulku recenze ↔ hvězdičky (RN — spolehlivěji než samotné mt-*). */
const HOME_SPOTLIGHT_REVIEW_STARS_TOP_GAP = 4;

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
  nowMs,
  t,
  locale,
}: {
  spotlight: HomeSpotlight;
  nowMs: number;
  t: (key: TranslationKey) => string;
  locale: string;
}) {
  const { booking, existingReviewRating } = spotlight;
  const { isDark } = useTheme();
  const navSheetRef = useRef<ActionSheetRef>(null);
  const callUsSheetRef = useRef<ActionSheetRef>(null);
  const shareSheetRef = useRef<ActionSheetRef>(null);

  const presentation = useMemo(
    () => resolveClientBookingSpotlightPresentation(booking, nowMs),
    [booking, nowMs]
  );
  const phase = presentation.phase;
  if (!phase) return null;

  const titleKey = spotlightPhaseTitleKey(phase, presentation.hasReviewRating);
  const dotLive = spotlightStatusDotLiveVariant(presentation.statusDot);
  const starFilledColor = isDark ? '#fbbf24' : '#f59e0b';
  const starEmptyColor = '#525252';

  const msUntilStart = Math.max(0, getBookingStartDate(booking).getTime() - nowMs);
  const bottomLeftLabel =
    presentation.bottomRowLeft === 'countdown'
      ? formatHomeSpotlightCountdown(msUntilStart, locale)
      : presentation.bottomRowLeft === 'slot_pill'
        ? formatHomeBookingSlotLabel(booking)
        : null;

  const showBottomRow =
    presentation.bottomRowLeft !== 'none' || presentation.bottomRowAction !== 'none';
  const showEmployeeSubtitle = phase !== 'review';
  const showAddress = phase === 'upcoming' || phase === 'lifecycle_confirmed';
  const showChevron =
    phase === 'today' ||
    phase === 'upcoming' ||
    phase === 'lifecycle_confirmed' ||
    phase === 'review';

  const openDetail = () => {
    if (presentation.linkTarget === 'review') {
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
              <View className="flex-row items-center gap-3 px-4 py-4">
                <View className="min-w-0 flex-1">
                  {phase === 'review' ? (
                    <View>
                      <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                        {t(titleKey)}
                      </ThemedText>
                      <View
                        className="flex-row gap-1.5"
                        style={{ marginTop: HOME_SPOTLIGHT_REVIEW_STARS_TOP_GAP }}>
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
                        <ThemedText className="min-w-0 shrink text-sm font-semibold" numberOfLines={1}>
                          {t(titleKey)}
                        </ThemedText>
                        {dotLive ? (
                          <View className="shrink-0 justify-center">
                            <LiveIndicator
                              variant={dotLive.variant}
                              size="sm"
                              animated={dotLive.animated}
                            />
                          </View>
                        ) : null}
                        {presentation.showHeaderCountdownPill ? (
                          <>
                            <View className="min-h-0 min-w-0 flex-1" />
                            <BookingCountdownPill target={getBookingStartDate(booking)} />
                          </>
                        ) : null}
                      </View>
                      {showEmployeeSubtitle ? (
                        <ThemedText
                          className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext"
                          numberOfLines={1}>
                          {booking.employee?.name ?? '—'} · {booking.branch?.name ?? ''}
                        </ThemedText>
                      ) : null}
                    </>
                  )}
                  {showAddress ? (
                    <BranchAddress
                      address={booking.branch?.address}
                      stripPostalCode
                      className="mt-1"
                      textClassName="text-xs leading-5 text-light-subtext dark:text-dark-subtext"
                      numberOfLines={2}
                    />
                  ) : null}
                </View>
                <Avatar
                  size="md"
                  src={booking.employee?.avatarUrl ?? undefined}
                  name={booking.employee?.name ?? undefined}
                />
                {showChevron ? (
                  <Icon
                    name="ChevronRight"
                    size={16}
                    className="shrink-0 text-light-subtext dark:text-dark-subtext"
                  />
                ) : null}
              </View>

              {presentation.actions.confirm ? (
                <View className="px-4 pb-3">
                  <AppButton
                    title={t('bookingDetailConfirmCta')}
                    variant="secondary"
                    size="sm"
                    fullWidth
                    iconStart="CalendarCheck"
                    onPress={(event) => {
                      event?.stopPropagation?.();
                      openBookingDetail(booking.id);
                    }}
                  />
                </View>
              ) : null}

              {presentation.actions.share && !showBottomRow ? (
                <View className="items-start px-4 pb-4 pt-0">
                  <AppButton
                    {...SPOTLIGHT_OUTLINE_BUTTON}
                    title={t('bookingShareMyBookingButton')}
                    iconStart="Share"
                    onPress={(event) => {
                      event?.stopPropagation?.();
                      shareSheetRef.current?.show();
                    }}
                  />
                </View>
              ) : null}

              {showBottomRow ? (
                <View className="flex-row items-center justify-between gap-2 px-4 pb-4 pt-0">
                  {bottomLeftLabel ? (
                    <ThemedText
                      className="min-w-0 shrink text-xs font-semibold tabular-nums text-light-text dark:text-dark-text"
                      numberOfLines={1}>
                      {bottomLeftLabel}
                    </ThemedText>
                  ) : (
                    <View className="min-w-0 flex-1" />
                  )}
                  <View className="min-w-0 shrink flex-row flex-wrap justify-end gap-2">
                    {presentation.bottomRowAction === 'navigate' ? (
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
                    {presentation.bottomRowAction === 'call' ? (
                      <AppButton
                        {...SPOTLIGHT_OUTLINE_BUTTON}
                        title={t('barberPhoneCall')}
                        iconStart="Phone"
                        onPress={(event) => {
                          event?.stopPropagation?.();
                          callUsSheetRef.current?.show();
                        }}
                      />
                    ) : null}
                    {presentation.bottomRowAction === 'calendar' &&
                    (Platform.OS === 'ios' || Platform.OS === 'android') ? (
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
      </View>

      {presentation.actions.navigate ? (
        <BranchNavigateSheet
          ref={navSheetRef}
          branchName={booking.branch?.name}
          address={booking.branch?.address}
        />
      ) : null}

      <OperatorCallUsSheet ref={callUsSheetRef} variant="callUs" showBranchOpenStatus />

      {presentation.actions.share ? (
        <ReservationShareSheet ref={shareSheetRef} bookingId={booking.id} />
      ) : null}
    </>
  );
}
