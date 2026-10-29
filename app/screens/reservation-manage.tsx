import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useRef } from 'react';
import { Animated, ImageSourcePropType, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import BookingDetailFooterActions from '@/components/booking/detail/BookingDetailFooterActions';
import BookingDetailHeroSection from '@/components/booking/detail/BookingDetailHeroSection';
import BookingDetailLocationSection from '@/components/booking/detail/BookingDetailLocationSection';
import BookingDetailReservationInfoSection from '@/components/booking/detail/BookingDetailReservationInfoSection';
import { BranchNavigateSheet, getBranchNavigateMapsQuery } from '@/components/BranchNavigateSheet';
import { OperatorCallUsSheet } from '@/components/OperatorSupportSheet';
import Header from '@/components/Header';
import SiteLoadingState from '@/components/SiteLoadingState';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { ReservationShareSheet } from '@/components/booking/ReservationShareSheet';
import { useTranslation } from '@/hooks/useTranslation';
import { useReservationManageScreen } from '@/hooks/useReservationManageScreen';
import { formatCancelSheetWhen } from '@/utils/bookingDetailHelpers';
import type { Booking } from '@/api/bookings';
import { canShareClientBooking, isBookingCancelledLike } from '@/utils/bookingHelpers';
import { useLanguage } from '@/contexts/LanguageContext';
export default function ReservationManageScreen() {
  const local = useLocalSearchParams<{ id?: string | string[]; key?: string | string[] }>();
  const id = (Array.isArray(local.id) ? local.id[0] : local.id) ?? '';
  const keyParam = Array.isArray(local.key) ? local.key[0] : local.key;
  const { t } = useTranslation();
  const { locale } = useLanguage();

  const {
    booking,
    showBrandedLoading,
    loadError,
    confirming,
    confirmError,
    cancelling,
    cancelError,
    onConfirm,
    onCancel,
  } = useReservationManageScreen({ id, key: keyParam });

  const heroScrollY = useRef(new Animated.Value(0)).current;
  const branchNavigateRef = useRef<ActionSheetRef>(null);
  const callUsSheetRef = useRef<ActionSheetRef>(null);
  const shareSheetRef = useRef<ActionSheetRef>(null);
  const cancelSheetRef = useRef<ActionSheetRef>(null);
  const carouselImages = useMemo(
    () => (booking ? resolveManageCarouselImages(booking) : []),
    [booking]
  );

  const location = booking?.branch?.address ?? booking?.branch?.name ?? '—';

  const cancelWhenLabel = booking ? formatCancelSheetWhen(booking, locale) : '';

  const handleShare = useCallback(() => {
    if (!booking?.id) return;
    shareSheetRef.current?.show();
  }, [booking?.id]);

  if (showBrandedLoading) {
    return (
      <>
        <Header title={t('bookingDetailTitle')} showBackButton />
        <SiteLoadingState layout="page" className="flex-1" />
      </>
    );
  }

  if (loadError === 'missing_token') {
    return (
      <>
        <Header title={t('bookingDetailTitle')} showBackButton />
        <View className="flex-1 px-global pt-8">
          <ThemedText className="text-lg font-bold">{t('reservationManageInvalidLinkTitle')}</ThemedText>
          <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
            {t('reservationManageInvalidLinkBody')}
          </ThemedText>
        </View>
      </>
    );
  }

  if (loadError || !booking) {
    const titleKey =
      loadError === 'not_found'
        ? 'reservationManageNotFoundTitle'
        : loadError === 'forbidden'
          ? 'reservationManageForbiddenTitle'
          : loadError === 'rate_limit'
            ? 'reservationManageRateLimitTitle'
            : 'reservationManageErrorTitle';
    const bodyKey =
      loadError === 'not_found'
        ? 'reservationManageNotFoundBody'
        : loadError === 'forbidden'
          ? 'reservationManageForbiddenBody'
          : loadError === 'rate_limit'
            ? 'reservationManageRateLimitBody'
            : 'reservationManageErrorBody';
    return (
      <>
        <Header title={t('bookingDetailTitle')} showBackButton />
        <View className="flex-1 px-global pt-8">
          <ThemedText className="text-lg font-bold">{t(titleKey)}</ThemedText>
          <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">{t(bodyKey)}</ThemedText>
        </View>
      </>
    );
  }

  const cancelledLike = isBookingCancelledLike(booking);
  const canShare = canShareClientBooking(booking);
  const navigateQuery = getBranchNavigateMapsQuery(booking.branch.name, booking.branch.address);

  return (
    <>
      <Header title={t('bookingDetailTitle')} showBackButton />
      <ThemedScroller className="flex-1" footerSpacer>
        <BookingDetailHeroSection
          carouselImages={carouselImages}
          heroScrollY={heroScrollY}
          booking={booking}
          location={location}
          confirmingAttendance={confirming}
          confirmAttendanceError={confirmError}
          onConfirmAttendance={() => void onConfirm()}
          onOpenBranchNavigate={() => branchNavigateRef.current?.show()}
          onCallBranch={() => callUsSheetRef.current?.show()}
          t={t}
        />
        <BookingDetailReservationInfoSection booking={booking} t={t} />
        <BookingDetailLocationSection booking={booking} location={location} t={t} />
        {cancelError ? (
          <View className="px-global pb-2">
            <ThemedText className="text-sm text-amber-600 dark:text-amber-400">{cancelError}</ThemedText>
          </View>
        ) : null}
      </ThemedScroller>

      <BookingDetailFooterActions
        booking={booking}
        hasReview={false}
        confirmingAttendance={confirming}
        cancelMessage={cancelWhenLabel}
        cancelSheetRef={cancelSheetRef}
        onShare={handleShare}
        t={t}
        guestManage={{
          cancelling,
          onCancelConfirm: onCancel,
          onReschedulePress: () =>
            router.push(`/screens/reschedule?id=${encodeURIComponent(booking.id)}&guestManage=1`),
        }}
      />

      {!cancelledLike && navigateQuery ? (
        <BranchNavigateSheet
          ref={branchNavigateRef}
          branchName={booking.branch.name}
          address={booking.branch.address}
        />
      ) : null}
      <OperatorCallUsSheet ref={callUsSheetRef} showBranchOpenStatus={false} />
      {canShare ? <ReservationShareSheet ref={shareSheetRef} bookingId={booking.id} /> : null}
    </>
  );
}

function resolveManageCarouselImages(booking: Booking): ImageSourcePropType[] {
  if (booking.item?.imageUrl) return [{ uri: booking.item.imageUrl }];
  return [require('@/assets/img/barbers.png')];
}
