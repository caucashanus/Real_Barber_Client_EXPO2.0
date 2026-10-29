import { Image } from 'expo-image';
import React, { useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  Pressable,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import HomePromoSlideCaption from '@/components/home/HomePromoSlideCaption';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';
import {
  CAROUSEL_BLEED_OUTER_CLASSNAME,
  SITE_CAROUSEL_PAGE_GUTTER_PX,
} from '@/utils/carouselMobileBleed';
import type { HomeReferralPromo } from '@/api/home';
import type { TranslationKey } from '@/locales';
import type { HomePromoFeedItem } from '@/utils/homePromoFeed';
import type { HomePromoCarouselLayout } from '@/utils/homePromoLayout';
import {
  buildHomePromoCarouselSlides,
  homePromoSlideAccessibilityLabel,
  type HomePromoCarouselSlide,
} from '@/utils/homePromoSlides';

interface HomePromoCarouselProps {
  feed: HomePromoFeedItem[];
  layout: HomePromoCarouselLayout;
  loading: boolean;
  t: (key: TranslationKey) => string;
  onReferralPress?: (referral: HomeReferralPromo) => void;
}

export function HomePromoCarousel({
  feed,
  layout,
  loading,
  t,
  onReferralPress,
}: HomePromoCarouselProps) {
  const { slideWidth, imageHeight, slideGap } = layout;
  const listRef = useRef<FlatList<HomePromoCarouselSlide>>(null);
  const isDraggingRef = useRef(false);

  const slides = useMemo(
    () =>
      buildHomePromoCarouselSlides(feed, {
        referralButtonText: t('referralHomeInviteCta'),
        onReferralPress,
      }),
    [feed, onReferralPress, t]
  );

  const renderSlide = useCallback(
    (slide: HomePromoCarouselSlide, index: number) => {
      const imageSource =
        typeof slide.image === 'string' ? { uri: slide.image } : slide.image;

      return (
        <Pressable
          onPress={() => {
            if (isDraggingRef.current) return;
            slide.onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={homePromoSlideAccessibilityLabel(slide)}
          style={{ width: slideWidth }}
          className="active:opacity-70">
          <View
            className="overflow-hidden rounded-xl bg-light-secondary dark:bg-dark-secondary"
            style={{ width: slideWidth, height: imageHeight }}>
            <Image
              source={imageSource}
              style={{ width: slideWidth, height: imageHeight }}
              contentFit="cover"
            />
          </View>
          <HomePromoSlideCaption
            title={slide.displayTitle}
            subtitle={slide.displaySubtitle}
            className="mt-3 pr-1"
          />
        </Pressable>
      );
    },
    [imageHeight, slideWidth]
  );

  const bleedTrackPadding = useMemo(
    () => ({
      paddingLeft: SITE_CAROUSEL_PAGE_GUTTER_PX,
      columnGap: slideGap,
    }),
    [slideGap]
  );

  const bleedEndSpacer = useMemo(
    () => <View style={{ width: SITE_CAROUSEL_PAGE_GUTTER_PX }} accessibilityElementsHidden />,
    []
  );

  const renderItem: ListRenderItem<HomePromoCarouselSlide> = useCallback(
    ({ item, index }) => renderSlide(item, index),
    [renderSlide]
  );

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isDraggingRef.current = false;
  }, []);

  if (!loading && slides.length === 0) return null;

  if (loading) {
    return (
      <View className={CAROUSEL_BLEED_OUTER_CLASSNAME}>
        <View style={{ paddingLeft: SITE_CAROUSEL_PAGE_GUTTER_PX }}>
          <View
            className="items-center justify-center rounded-xl bg-light-secondary dark:bg-dark-secondary"
            style={{ width: slideWidth, height: imageHeight }}>
            <SiteLoadingSpinner size="compact" />
          </View>
        </View>
      </View>
    );
  }

  if (slides.length === 1) {
    return <View style={{ width: slideWidth }}>{renderSlide(slides[0]!, 0)}</View>;
  }

  return (
    <View className={CAROUSEL_BLEED_OUTER_CLASSNAME}>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        onScrollBeginDrag={() => {
          isDraggingRef.current = true;
        }}
        onScrollEndDrag={onScrollEnd}
        onMomentumScrollEnd={onScrollEnd}
        decelerationRate="normal"
        contentContainerStyle={bleedTrackPadding}
        ListFooterComponent={bleedEndSpacer}
        className="w-full"
      />
    </View>
  );
}
