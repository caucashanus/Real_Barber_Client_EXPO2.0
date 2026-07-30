import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';

import type { ClientPoster } from '@/api/client-posters';
import {
  getHomePromoSlideAccessibilityLabel,
  HomePromoCarouselOverlay,
  type HomePromoCarouselOverlaySlide,
} from '@/components/HomePromoCarouselOverlay';
import ImageCarousel from '@/components/ImageCarousel';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import type { HomePromoFeedItem } from '@/utils/homePromoFeed';

interface HomePromoSlide {
  imageUrl: string;
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

function openPosterTarget(poster: ClientPoster): void {
  const web = poster.websiteUrl?.trim();
  const vid = poster.videoUrl?.trim();
  if (web) {
    WebBrowser.openBrowserAsync(web).catch(() => {});
    return;
  }
  if (vid) {
    WebBrowser.openBrowserAsync(vid).catch(() => {});
  }
}

function buildHomePromoSlides(feed: HomePromoFeedItem[]): HomePromoSlide[] {
  const slides: HomePromoSlide[] = [];
  for (const item of feed) {
    if (item.kind === 'coupon') {
      const imageUrl = item.coupon.imageUrl?.trim();
      if (!imageUrl) continue;
      slides.push({
        imageUrl,
        overlay: {
          buttonText: resolveButtonText(item.coupon.buttonText),
          accessibilityFallback: item.coupon.name,
        },
        onPress: () => {
          router.push(
            `/screens/client-coupon-detail?id=${encodeURIComponent(item.coupon.id)}` as never
          );
        },
      });
      continue;
    }
    const imageUrl = item.poster.imageUrl?.trim();
    if (!imageUrl) continue;
    slides.push({
      imageUrl,
      overlay: {
        buttonText: resolveButtonText(item.poster.buttonText),
        accessibilityFallback: posterAccessibilityFallback(item.poster),
      },
      onPress: () => openPosterTarget(item.poster),
    });
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
}: HomePromoCarouselProps) {
  const slides = useMemo(() => buildHomePromoSlides(feed), [feed]);
  const images = useMemo(() => slides.map((slide) => slide.imageUrl), [slides]);

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
      <View
        style={{ height }}
        className="w-full items-center justify-center rounded-xl bg-light-secondary dark:bg-dark-secondary">
        <ActivityIndicator size="small" />
        <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
          {t('commonLoading')}
        </ThemedText>
      </View>
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
