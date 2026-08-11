import React from 'react';
import { Animated, ImageSourcePropType, View } from 'react-native';

import type { Booking } from '@/api/bookings';
import AppButton from '@/components/AppButton';
import BranchAddress from '@/components/shared/BranchAddress';
import ImageCarousel from '@/components/ImageCarousel';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface BookingDetailHeroSectionProps {
  carouselImages: ImageSourcePropType[] | string[];
  heroScrollY: Animated.Value;
  booking: Booking;
  location: string;
  canOpenBranchNavigate: boolean;
  onOpenBranchNavigate: () => void;
  t: (key: TranslationKey) => string;
}

export default function BookingDetailHeroSection({
  carouselImages,
  heroScrollY,
  booking,
  location,
  canOpenBranchNavigate,
  onOpenBranchNavigate,
  t,
}: BookingDetailHeroSectionProps) {
  return (
    <>
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
        <View className="mb-2 flex-row items-center justify-between gap-2">
          <ThemedText
            className="min-w-0 flex-1 shrink pr-1 text-xl font-bold leading-tight"
            numberOfLines={2}>
            {booking.branch?.name ?? '—'}
          </ThemedText>
          <View className="shrink-0 flex-row items-center gap-1.5">
            {canOpenBranchNavigate ? (
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
          </View>
        </View>

        <BranchAddress address={location === '—' ? null : location} className="mb-2" />
      </View>
    </>
  );
}
