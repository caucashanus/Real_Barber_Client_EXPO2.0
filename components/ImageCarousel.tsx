import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  LayoutChangeEvent,
  Animated,
  Pressable,
  ImageSourcePropType,
  Platform,
} from 'react-native';

import ThemedText from '@/components/ThemedText';

interface ImageCarouselProps {
  images: string[] | ImageSourcePropType[];
  width?: number;
  height?: number;
  showPagination?: boolean;
  paginationStyle?: 'dots' | 'numbers';
  /** Dots over image (default) or in a row below the carousel. */
  paginationPlacement?: 'overlay' | 'below';
  paginationBelowClassName?: string;
  onImagePress?: (index: number) => void;
  renderOverlay?: (index: number) => React.ReactNode;
  getAccessibilityLabel?: (index: number) => string | undefined;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  loop?: boolean;
  /** Placeholder behind remote images while loading (e.g. `#000` for interior tiles). */
  imageBackgroundColor?: string;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Parent scroll value for stretchy hero pull-down effect. */
  scrollY?: Animated.Value;
  /** Enable pull-down stretch animation (requires scrollY). */
  stretchOnPullDown?: boolean;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  width: propWidth,
  height = 200,
  showPagination = true,
  paginationStyle = 'dots',
  paginationPlacement = 'overlay',
  paginationBelowClassName = 'mt-2',
  onImagePress,
  renderOverlay,
  getAccessibilityLabel,
  autoPlay = false,
  autoPlayInterval = 3000,
  loop = true,
  imageBackgroundColor = '#f0f0f0',
  className = '',
  rounded = 'none',
  scrollY,
  stretchOnPullDown = false,
}) => {
  const [containerWidth, setContainerWidth] = useState(propWidth || Dimensions.get('window').width);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = React.useRef<FlatList>(null);
  const activeIndexRef = React.useRef(0);

  useEffect(() => {
    if (propWidth != null) {
      setContainerWidth(propWidth);
    }
  }, [propWidth]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
    activeIndexRef.current = 0;
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [images]);

  const scrollToIndex = (index: number, animated = true) => {
    flatListRef.current?.scrollToOffset({
      offset: index * containerWidth,
      animated,
    });
    setActiveIndex(index);
    activeIndexRef.current = index;
  };

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;
    const id = setInterval(() => {
      const next = (activeIndexRef.current + 1) % images.length;
      flatListRef.current?.scrollToOffset({
        offset: next * containerWidth,
        animated: true,
      });
      setActiveIndex(next);
      activeIndexRef.current = next;
    }, autoPlayInterval);
    return () => clearInterval(id);
  }, [autoPlay, autoPlayInterval, images.length, containerWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    if (propWidth != null) return;
    const { width } = event.nativeEvent.layout;
    if (width > 0) setContainerWidth(width);
  };

  const getRoundedClass = () => {
    switch (rounded) {
      case 'none':
        return '';
      case 'sm':
        return 'rounded-sm';
      case 'md':
        return 'rounded-md';
      case 'lg':
        return 'rounded-lg';
      case 'xl':
        return 'rounded-xl';
      case '2xl':
        return 'rounded-2xl';
      case 'full':
        return 'rounded-full';
      default:
        return '';
    }
  };

  const handleImageChange = (contentOffsetX: number) => {
    const index = Math.round(contentOffsetX / containerWidth);
    setActiveIndex(index);
  };

  const renderPaginationContent = () => {
    if (!showPagination || images.length <= 1) return null;

    const isBelow = paginationPlacement === 'below';
    const activeDotClass = isBelow
      ? 'bg-light-text dark:bg-dark-text'
      : 'bg-white';
    const inactiveDotClass = isBelow
      ? 'bg-light-subtext/40 dark:bg-dark-subtext/40'
      : 'bg-white/40';

    if (paginationStyle === 'dots') {
      return images.map((_, index) => (
        <Pressable
          key={index}
          accessibilityRole="button"
          accessibilityLabel={`Slide ${index + 1}`}
          hitSlop={6}
          onPress={() => scrollToIndex(index)}
          className={`mx-1 h-2 w-2 rounded-full ${
            index === activeIndex ? activeDotClass : inactiveDotClass
          }`}
        />
      ));
    }

    return (
      <View className={`rounded-full px-3 py-1 ${isBelow ? 'bg-light-secondary dark:bg-dark-secondary' : 'bg-black/50'}`}>
        <ThemedText className={isBelow ? 'text-light-text dark:text-dark-text' : 'text-white'}>
          {activeIndex + 1} / {images.length}
        </ThemedText>
      </View>
    );
  };

  const renderPagination = () => {
    const content = renderPaginationContent();
    if (paginationPlacement === 'below') {
      return (
        <View
          className={`${paginationBelowClassName} w-full flex-row items-center justify-center`}>
          {content}
        </View>
      );
    }

    if (!content) return null;

    return (
      <View className="absolute bottom-4 w-full flex-row justify-center">{content}</View>
    );
  };

  const slideStyle = { width: containerWidth, height, position: 'relative' as const };

  const renderItem = ({ item, index }: { item: string | ImageSourcePropType; index: number }) => {
    const image = (
      <Image
        source={typeof item === 'string' ? { uri: item } : item}
        style={[
          styles.image,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: containerWidth,
            height,
            backgroundColor: imageBackgroundColor,
          },
        ]}
        contentFit="cover"
      />
    );

    if (onImagePress) {
      return (
        <Pressable
          style={slideStyle}
          onPress={() => onImagePress(index)}
          accessibilityRole="button"
          accessibilityLabel={getAccessibilityLabel?.(index)}>
          {image}
          {renderOverlay?.(index)}
        </Pressable>
      );
    }

    return (
      <View style={slideStyle}>
        {image}
        {renderOverlay?.(index)}
      </View>
    );
  };

  const heroAnimatedStyle =
    stretchOnPullDown && scrollY
      ? {
          transform: [
            {
              scale: scrollY.interpolate({
                inputRange: [-160, 0],
                outputRange: [1.18, 1],
                extrapolate: 'clamp',
              }),
            },
            {
              translateY: scrollY.interpolate({
                inputRange: [-160, 0],
                outputRange: [-20, 0],
                extrapolate: 'clamp',
              }),
            },
          ],
        }
      : undefined;

  const carouselBody = (
    <Animated.View style={[styles.animatedContainer, heroAnimatedStyle]}>
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        {...(Platform.OS === 'ios'
          ? { pagingEnabled: true }
          : {
              pagingEnabled: false,
              snapToInterval: containerWidth,
              snapToAlignment: 'start' as const,
              decelerationRate: 'fast' as const,
              disableIntervalMomentum: true,
            })}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({
          length: containerWidth,
          offset: containerWidth * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const contentOffsetX = e.nativeEvent.contentOffset.x;
          handleImageChange(contentOffsetX);
        }}
        onScrollEndDrag={(e) => {
          const contentOffsetX = e.nativeEvent.contentOffset.x;
          handleImageChange(contentOffsetX);
        }}
        style={{ height, width: containerWidth }}
        contentContainerStyle={{ width: containerWidth * images.length }}
      />
    </Animated.View>
  );

  if (paginationPlacement === 'below') {
    return (
      <View className={className} style={{ width: propWidth }} onLayout={handleLayout}>
        <View
          className={getRoundedClass()}
          style={[
            styles.container,
            {
              height,
              width: propWidth,
              overflow: 'hidden',
            },
          ]}>
          {carouselBody}
        </View>
        {renderPagination()}
      </View>
    );
  }

  return (
    <View
      className={`${getRoundedClass()} ${className}`}
      style={[
        styles.container,
        {
          height,
          width: propWidth,
          overflow: 'hidden',
        },
      ]}
      onLayout={handleLayout}>
      {carouselBody}
      {renderPagination()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: '#f0f0f0',
  },
  animatedContainer: {
    width: '100%',
    height: '100%',
  },
});

export default ImageCarousel;
