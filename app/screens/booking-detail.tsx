import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { View, ActivityIndicator, Animated, Platform, ImageSourcePropType } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import type { Booking } from '@/api/bookings';
import type { Branch } from '@/api/branches';
import { useLanguage } from '@/app/contexts/LanguageContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useBookingDetailScreen } from '@/app/hooks/useBookingDetailScreen';
import { useTranslation } from '@/app/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import { BranchNavigateSheet, getBranchNavigateMapsQuery } from '@/components/BranchNavigateSheet';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import BookingDetailAppointmentSection from '@/components/booking/detail/BookingDetailAppointmentSection';
import BookingDetailCalendarPromoModal from '@/components/booking/detail/BookingDetailCalendarPromoModal';
import BookingDetailEmployeeSection from '@/components/booking/detail/BookingDetailEmployeeSection';
import BookingDetailFooterActions from '@/components/booking/detail/BookingDetailFooterActions';
import BookingDetailHeroSection from '@/components/booking/detail/BookingDetailHeroSection';
import BookingDetailLocationSection from '@/components/booking/detail/BookingDetailLocationSection';
import BookingDetailPriceSection from '@/components/booking/detail/BookingDetailPriceSection';
import BookingDetailReservationInfoSection from '@/components/booking/detail/BookingDetailReservationInfoSection';
import { addBookingToCalendar } from '@/utils/bookingCalendar';
import {
  BRANCH_IMAGES,
  branchImages,
  formatAppointment,
  formatCancelSheetWhen,
} from '@/utils/bookingDetailHelpers';
import { isBookingCurrent, isBookingMarkedCompleted, isBookingPast } from '@/utils/bookingHelpers';

const BookingDetailScreen = () => {
  const local = useLocalSearchParams<{
    id: string | string[];
    openReview?: string;
    justBooked?: string | string[];
  }>();
  const id = (Array.isArray(local.id) ? local.id[0] : local.id) ?? '';
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const dateLocaleTag = locale === 'cs' ? 'cs-CZ' : 'en-GB';

  const {
    booking,
    branch,
    hasReview,
    loading,
    error,
    calendarPromoVisible,
    setCalendarPromoVisible,
  } = useBookingDetailScreen({
    id,
    openReview: local.openReview,
    justBooked: local.justBooked,
  });

  const cancelSheetRef = useRef<ActionSheetRef>(null);
  const branchNavigateRef = useRef<ActionSheetRef>(null);
  const heroScrollY = useRef(new Animated.Value(0)).current;

  const formatDetailMoney = useCallback(
    (value: unknown) => {
      const n = typeof value === 'number' ? value : Number(value);
      const x = Number.isFinite(n) ? n : 0;
      return x.toLocaleString(dateLocaleTag, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    },
    [dateLocaleTag]
  );

  const formatAppliedAt = useCallback(
    (iso: string) => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString(dateLocaleTag, { dateStyle: 'short', timeStyle: 'short' });
    },
    [dateLocaleTag]
  );

  const handleAddToCalendar = useCallback(async () => {
    if (!booking) return;
    await addBookingToCalendar(booking, {
      noteBarberPrefix: t('bookingCalendarNoteBarber'),
      reservationNumberPrefix: t('bookingReservationNumber'),
      errorTitle: t('commonError'),
      errorMessage: t('bookingAddToCalendarFailed'),
    }).catch(() => {});
  }, [booking, t]);

  const handleCalendarPromoAdd = useCallback(() => {
    if (!booking) return;
    setCalendarPromoVisible(false);
    setTimeout(() => {
      addBookingToCalendar(booking, {
        noteBarberPrefix: t('bookingCalendarNoteBarber'),
        reservationNumberPrefix: t('bookingReservationNumber'),
        errorTitle: t('commonError'),
        errorMessage: t('bookingAddToCalendarFailed'),
      });
    }, 320);
  }, [booking, setCalendarPromoVisible, t]);

  if (loading) {
    return (
      <>
        <Header title={t('bookingDetailTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Header title={t('bookingDetailTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary p-6 dark:bg-dark-primary">
          <ThemedText className="text-center text-red-500 dark:text-red-400">
            {error ?? t('bookingNotFound')}
          </ThemedText>
        </View>
      </>
    );
  }

  const appointment = formatAppointment(booking, dateLocaleTag);
  const location = booking.branch?.address ?? booking.branch?.name ?? '—';
  const status = (booking.status ?? '').toLowerCase();
  const isCancelled = status === 'cancelled' || status === 'canceled';
  const isCompleted = isBookingMarkedCompleted(booking);
  const isCurrent = !isCancelled && isBookingCurrent(booking);
  const isPast = !isCancelled && !isCurrent && (isCompleted || isBookingPast(booking));
  const isUpcoming = !isCancelled && !isCurrent && !isPast;
  const canOpenBranchNavigate =
    !isCancelled &&
    getBranchNavigateMapsQuery(
      booking.branch?.name ?? branch?.name,
      booking.branch?.address ?? branch?.address
    ) !== '';
  const canAddToCalendar =
    (Platform.OS === 'ios' || Platform.OS === 'android') && !isCancelled && !isPast;
  const cancelWhen = formatCancelSheetWhen(booking, locale);
  const cancelMessage = `${t('bookingDetailCancelConfirmIntro')} ${cancelWhen} ${t('bookingDetailCancelConfirmAtBranch')} ${booking.branch?.name ?? '—'}. ${t('bookingDetailCancelConfirmNote')}`;
  const carouselImages = resolveCarouselImages(branch, booking);

  return (
    <>
      <Header title={t('bookingDetailTitle')} showBackButton />
      <ThemedScroller
        className="flex-1 px-0"
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: heroScrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>
        <AnimatedView animation="fadeIn" duration={400} delay={100}>
          <BookingDetailHeroSection
            carouselImages={carouselImages}
            heroScrollY={heroScrollY}
            booking={booking}
            location={location}
            canOpenBranchNavigate={canOpenBranchNavigate}
            onOpenBranchNavigate={() => branchNavigateRef.current?.show()}
            t={t}
          />
          <BookingDetailEmployeeSection booking={booking} t={t} />
          <BookingDetailAppointmentSection
            appointment={appointment}
            booking={booking}
            canAddToCalendar={canAddToCalendar}
            onAddToCalendar={handleAddToCalendar}
            t={t}
          />
          <BookingDetailReservationInfoSection booking={booking} t={t} />
          <BookingDetailPriceSection
            booking={booking}
            formatDetailMoney={formatDetailMoney}
            formatAppliedAt={formatAppliedAt}
            t={t}
          />
          <BookingDetailLocationSection booking={booking} location={location} t={t} />
        </AnimatedView>
      </ThemedScroller>

      <BranchNavigateSheet
        ref={branchNavigateRef}
        branchName={booking.branch?.name ?? branch?.name}
        address={booking.branch?.address ?? branch?.address}
      />

      <BookingDetailFooterActions
        booking={booking}
        hasReview={hasReview}
        isCancelled={isCancelled}
        isCurrent={isCurrent}
        isPast={isPast}
        isUpcoming={isUpcoming}
        cancelMessage={cancelMessage}
        cancelSheetRef={cancelSheetRef}
        t={t}
      />

      <BookingDetailCalendarPromoModal
        visible={calendarPromoVisible}
        sheetBackgroundColor={colors.sheet}
        onClose={() => setCalendarPromoVisible(false)}
        onAddToCalendar={handleCalendarPromoAdd}
        t={t}
      />
    </>
  );
};

function resolveCarouselImages(branch: Branch | null, booking: Booking): ImageSourcePropType[] {
  if (branch != null) return branchImages(branch) as ImageSourcePropType[];
  if (booking.branch?.name && BRANCH_IMAGES[booking.branch.name] != null) {
    return [BRANCH_IMAGES[booking.branch.name]];
  }
  return [require('@/assets/img/branches/Modrany.jpg')];
}

export default BookingDetailScreen;
