import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ImageSourcePropType, View } from 'react-native';

import type { HomeReferralPromo } from '@/api/home';
import type { ClientPoster } from '@/api/client-posters';
import {
  getHomePromoSlideAccessibilityLabel,
  HomePromoCarouselOverlay,
  type HomePromoCarouselOverlaySlide} from '@/components/HomePromoCarouselOverlay';
import ImageCarousel from '@/components/ImageCarousel';
import SurfaceCard from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';
import { promoKuponHref, promoPosterHref } from '@/constants/promoDetailRoutes';
import type { TranslationKey } from '@/locales';
import {
  resolveHomeReferralPromoImage,
  type HomePromoFeedItem,
} from '@/utils/homePromoFeed';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';

interface HomePromoSlide {
  image: string | ImageSourcePropType;
  overlay: HomePromoCarouselOverlaySlide;
  onPress: () => void;
}

interface HomePromoCarouselProps {
  feed: HomePromoFeedItem[];
  width: number;
  height: number;
  loading: boolean;
  locale: string;
  t: (key: TranslationKey) => string;
  onReferralPress?: (referral: HomeReferralPromo) => void;
}

function resolveButtonText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

function posterAccessibilityFallback(poster: ClientPoster): string {
  const title = poster.title?.trim() ?? '';
  const subtitle = poster.subtitle?.trim() ?? '';
  return title || subtitle;
}

function buildHomePromoSlides(
  feed: HomePromoFeedItem[],
  options: {
    referralButtonText: string;
    onReferralPress?: (referral: HomeReferralPromo) => void;
  }
): HomePromoSlide[] {
  const slides: HomePromoSlide[] = [];
  for (const item of feed) {
    if (item.kind === 'referral') {
      slides.push({
        image: resolveHomeReferralPromoImage(item.referral),
        overlay: {
          buttonText: options.referralButtonText,
          accessibilityFallback: options.referralButtonText,
        },
        onPress: () => {
          options.onReferralPress?.(item.referral);
        },
      });
      continue;
    }

    if (item.kind === 'coupon') {
      const imageUrl = item.coupon.imageUrl?.trim();
      if (!imageUrl) continue;
      slides.push({
        image: imageUrl,
        overlay: {
          buttonText: resolveButtonText(item.coupon.buttonText),
          accessibilityFallback: item.coupon.name},
        onPress: () => {
          router.push(promoKuponHref(item.coupon.id) as never);
        }});
      continue;
    }
    const imageUrl = item.poster.imageUrl?.trim();
    if (!imageUrl) continue;
    slides.push({
      image: imageUrl,
      overlay: {
        buttonText: resolveButtonText(item.poster.buttonText),
        accessibilityFallback: posterAccessibilityFallback(item.poster)},
      onPress: () => {
        router.push(promoPosterHref(item.poster.id) as never);
      }});
  }
  return slides;
}

export function HomePromoCarousel({
  feed,
  width,
  height,
  loading,
  locale: _locale,
  t,
  onReferralPress,
}: HomePromoCarouselProps) {
  const slides = useMemo(
    () =>
      buildHomePromoSlides(feed, {
        referralButtonText: t('referralHomeInviteCta'),
        onReferralPress,
      }),
    [feed, onReferralPress, t]
  );
  const images = useMemo(() => slides.map((slide) => slide.image), [slides]);

  const handlePress = useCallback(
    (index: number) => {
      slides[index]?.onPress();
    },
    [slides]
  );

  const renderOverlay = useCallback(
    (index: number) => {
      const slide = slides[index];
      if (!slide) return null;
      return (
        <HomePromoCarouselOverlay slide={slide.overlay} width={width} height={height} />
      );
    },
    [slides, width, height]
  );

  const getAccessibilityLabel = useCallback(
    (index: number) => {
      const slide = slides[index];
      if (!slide) return undefined;
      return getHomePromoSlideAccessibilityLabel(slide.overlay);
    },
    [slides]
  );

  if (!loading && slides.length === 0) return null;

  if (loading) {
    return (
      <SurfaceCard rounded="2xl" style={{ height }} className="w-full items-center justify-center">
        <SiteLoadingSpinner size="compact" />
      </SurfaceCard>
    );
  }

  return (
    <ImageCarousel
      width={width}
      rounded="xl"
      height={height}
      className="w-full"
      images={images}
      paginationStyle="dots"
      paginationPlacement="below"
      paginationBelowClassName="h-7"
      autoPlay
      autoPlayInterval={3000}
      loop
      onImagePress={handlePress}
      renderOverlay={renderOverlay}
      getAccessibilityLabel={getAccessibilityLabel}
    />
  );
}
