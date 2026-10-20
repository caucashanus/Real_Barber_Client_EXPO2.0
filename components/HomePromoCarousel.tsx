import { Image } from 'expo-image';
import React, { useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import HomePromoSlideCaption from '@/components/home/HomePromoSlideCaption';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';
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
  const snapInterval = slideWidth + slideGap;
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
          style={{ width: slideWidth, marginRight: index < slides.length - 1 ? slideGap : 0 }}
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
    [imageHeight, slideGap, slideWidth, slides.length]
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
      <View
        className="items-center justify-center rounded-xl bg-light-secondary dark:bg-dark-secondary"
        style={{ width: slideWidth, height: imageHeight }}>
        <SiteLoadingSpinner size="compact" />
      </View>
    );
  }

  if (slides.length === 1) {
    return <View className="w-full">{renderSlide(slides[0]!, 0)}</View>;
  }

  return (
    <FlatList
      ref={listRef}
      data={slides}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      onScrollBeginDrag={() => {
        isDraggingRef.current = true;
      }}
      onScrollEndDrag={onScrollEnd}
      onMomentumScrollEnd={onScrollEnd}
      decelerationRate="fast"
      snapToAlignment="start"
      snapToInterval={snapInterval}
      {...(Platform.OS === 'ios' ? { pagingEnabled: false } : {})}
      getItemLayout={(_, index) => ({
        length: snapInterval,
        offset: snapInterval * index,
        index,
      })}
      className="w-full"
    />
  );
}
