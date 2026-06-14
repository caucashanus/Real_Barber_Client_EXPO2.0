import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import { Animated, FlatList, View, useWindowDimensions } from 'react-native';

import VideoPlayer from '@/components/VideoPlayer';
import type { TopSlide } from '@/utils/barberDetailHelpers';

const CAROUSEL_HEIGHT = 500;

interface BarberHeroCarouselProps {
  topSlides: TopSlide[];
  heroScrollY: Animated.Value;
}

export default function BarberHeroCarousel({ topSlides, heroScrollY }: BarberHeroCarouselProps) {
  const { width: carouselWidth } = useWindowDimensions();
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const topCarouselRef = useRef<FlatList>(null);

  return (
    <Animated.View
      style={{
        height: CAROUSEL_HEIGHT,
        width: carouselWidth,
        transform: [
          {
            scale: heroScrollY.interpolate({
              inputRange: [-160, 0],
              outputRange: [1.18, 1],
              extrapolate: 'clamp',
            }),
          },
          {
            translateY: heroScrollY.interpolate({
              inputRange: [-160, 0],
              outputRange: [-20, 0],
              extrapolate: 'clamp',
            }),
          },
        ],
      }}>
      <FlatList
        ref={topCarouselRef}
        data={topSlides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / carouselWidth);
          setActiveCarouselIndex(idx);
        }}
        renderItem={({ item, index }) => (
          <View style={{ width: carouselWidth, height: CAROUSEL_HEIGHT }}>
            {item.type === 'video' ? (
              <VideoPlayer
                uri={item.uri}
                style={{ width: carouselWidth, height: CAROUSEL_HEIGHT }}
                contentFit="cover"
                shouldPlay={activeCarouselIndex === index}
                isMuted
                isLooping
              />
            ) : (
              <Image
                source={item.uri ? { uri: item.uri } : require('@/assets/img/barbers.png')}
                style={{ width: carouselWidth, height: CAROUSEL_HEIGHT }}
                contentFit="cover"
              />
            )}
          </View>
        )}
      />
      {topSlides.length > 1 ? (
        <View className="absolute bottom-4 w-full flex-row justify-center">
          {topSlides.map((_, index) => (
            <View
              key={index}
              className={`mx-1 h-2 w-2 rounded-full ${index === activeCarouselIndex ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}
