import React, { useEffect, useState } from 'react';
import { Animated, ImageSourcePropType, View } from 'react-native';

import type { Booking } from '@/api/bookings';
import AppButton from '@/components/AppButton';
import BranchAddress from '@/components/shared/BranchAddress';
import ImageCarousel from '@/components/ImageCarousel';
import BookingDetailConfirmSection from '@/components/booking/detail/BookingDetailConfirmSection';
import BookingDetailStatusHeader from '@/components/booking/detail/BookingDetailStatusHeader';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { resolveClientBookingSpotlightPresentation } from '@/utils/clientBookingSpotlightPresentation';

const NOW_TICK_MS = 15_000;

interface BookingDetailHeroSectionProps {
  carouselImages: ImageSourcePropType[] | string[];
  heroScrollY: Animated.Value;
  booking: Booking;
  location: string;
  confirmingAttendance: boolean;
  confirmAttendanceError: string | null;
  onConfirmAttendance: () => void;
  onOpenBranchNavigate: () => void;
  onCallBranch: () => void;
  t: (key: TranslationKey) => string;
}

export default function BookingDetailHeroSection({
  carouselImages,
  heroScrollY,
  booking,
  location,
  confirmingAttendance,
  confirmAttendanceError,
  onConfirmAttendance,
  onOpenBranchNavigate,
  onCallBranch,
  t,
}: BookingDetailHeroSectionProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), NOW_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const presentation = resolveClientBookingSpotlightPresentation(booking, nowMs);
  const showNavigatePill = presentation.actions.navigate;
  const showCallPill = presentation.actions.call;

  return (
    <View>
      <View className="px-global">
        <ImageCarousel
          height={300}
          rounded="2xl"
          images={carouselImages}
          scrollY={heroScrollY}
          stretchOnPullDown
        />
      </View>

      <View className="px-global pb-4 pt-6">
        <BookingDetailStatusHeader booking={booking} />
        <BookingDetailConfirmSection
          booking={booking}
          confirming={confirmingAttendance}
          confirmError={confirmAttendanceError}
          onConfirm={onConfirmAttendance}
          t={t}
        />
        <View className="mb-2 flex-row items-center justify-between gap-2">
          <ThemedText
            className="min-w-0 flex-1 shrink pr-1 text-xl font-bold leading-tight"
            numberOfLines={2}>
            {booking.branch?.name ?? '—'}
          </ThemedText>
          {showNavigatePill || showCallPill ? (
            <View className="shrink-0 flex-row items-center gap-1.5">
              {showNavigatePill ? (
                <AppButton
                  title={t('branchNavigateSectionTitle')}
                  variant="outline"
                  size="sm"
                  rounded="full"
                  className="px-2.5 py-1"
                  iconStart="Navigation"
                  iconSize={13}
                  textClassName="text-xs font-semibold leading-tight"
                  onPress={onOpenBranchNavigate}
                />
              ) : null}
              {showCallPill ? (
                <AppButton
                  title={t('barberPhoneCall')}
                  variant="outline"
                  size="sm"
                  rounded="full"
                  className="px-2.5 py-1"
                  iconStart="Phone"
                  iconSize={13}
                  textClassName="text-xs font-semibold leading-tight"
                  onPress={onCallBranch}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        <BranchAddress address={location === '—' ? null : location} className="mb-2" />
      </View>
    </View>
  );
}
