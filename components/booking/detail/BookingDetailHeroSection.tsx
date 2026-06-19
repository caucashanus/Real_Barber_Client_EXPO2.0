import React from 'react';
import { Animated, ImageSourcePropType, Pressable, View } from 'react-native';

import type { Booking } from '@/api/bookings';
import Icon from '@/components/Icon';
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
        <View className="mb-2 flex-row items-start justify-between gap-2">
          <ThemedText variant="h2" className="min-w-0 flex-1 shrink pr-1">
            {booking.branch?.name ?? '—'}
          </ThemedText>
          {canOpenBranchNavigate ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('branchNavigateSectionTitle')}
              onPress={onOpenBranchNavigate}
              className="mt-1 h-7 shrink-0 flex-row items-center justify-center gap-0.5 rounded-full bg-light-secondary px-2.5 active:opacity-80 dark:bg-dark-secondary">
              <Icon name="Navigation" size={12} className="text-light-text dark:text-dark-text" />
              <ThemedText variant="caption" className="text-center">
                {t('branchNavigateSectionTitle')}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
        <View className="mb-2 flex-row items-start gap-2">
          <Icon
            name="MapPin"
            size={16}
            className="mt-0.5 shrink-0 text-light-subtext dark:text-dark-subtext"
          />
          <ThemedText className="min-w-0 flex-1 leading-snug text-light-subtext dark:text-dark-subtext">
            {location}
          </ThemedText>
        </View>
      </View>
    </>
  );
}