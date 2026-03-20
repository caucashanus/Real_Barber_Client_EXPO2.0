import React, { useState, useEffect } from 'react';
import { View, FlatList, Image, Dimensions, StyleSheet, LayoutChangeEvent, Animated } from 'react-native';
import { ImageSourcePropType } from 'react-native';
import ThemedText from '@/components/ThemedText';

interface ImageCarouselProps {
    images: string[] | ImageSourcePropType[];
    width?: number;
    height?: number;
    showPagination?: boolean;
    paginationStyle?: 'dots' | 'numbers';
    onImagePress?: (index: number) => void;
    autoPlay?: boolean;
    autoPlayInterval?: number;
    loop?: boolean;
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
    onImagePress,
    autoPlay = false,
    autoPlayInterval = 3000,
    loop = true,
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
        activeIndexRef.current = activeIndex;
    }, [activeIndex]);

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
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
    };

    const getRoundedClass = () => {
        switch (rounded) {
            case 'none': return '';
            case 'sm': return 'rounded-sm';
            case 'md': return 'rounded-md';
            case 'lg': return 'rounded-lg';
            case 'xl': return 'rounded-xl';
            case '2xl': return 'rounded-2xl';
            case 'full': return 'rounded-full';
            default: return '';
        }
    };

    const handleImageChange = (contentOffsetX: number) => {
        const index = Math.round(contentOffsetX / containerWidth);
        setActiveIndex(index);
    };

    const handleImagePress = () => {
        if (onImagePress) {
            onImagePress(activeIndex);
        }
    };

    const renderPagination = () => {
        if (!showPagination || images.length <= 1) return null;

        return (
            <View className="flex-row justify-center absolute bottom-4 w-full">
                {paginationStyle === 'dots' ? (
                    images.map((_, index) => (
                        <View
                            key={index}
                            className={`h-2 w-2 rounded-full mx-1 ${
                                index === activeIndex ? 'bg-white' : 'bg-white/40'
                            }`}
                        />
                    ))
                ) : (
                    <View className="bg-black/50 px-3 py-1 rounded-full">
                        <ThemedText className="text-white">
                            {activeIndex + 1} / {images.length}
                        </ThemedText>
                    </View>
                )}
            </View>
        );
    };

    const renderItem = ({ item, index }: { item: string | ImageSourcePropType; index: number }) => (
        <View style={{ width: containerWidth, height }}>
            <Image
                source={typeof item === 'string' ? { uri: item } : item}
                style={[
                    styles.image,
                    {
                        width: containerWidth,
                        height,
                    },
                ]}
                
                resizeMode="cover"
            />
        </View>
    );

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

    return (
        <View 
            className={`${getRoundedClass()} ${className}`}
            style={[
                styles.container,
                {
                    height,
                    overflow: 'hidden',
                },
            ]}
            onLayout={handleLayout}
        >
            <Animated.View style={[styles.animatedContainer, heroAnimatedStyle]}>
                <FlatList
                    ref={flatListRef}
                    data={images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={renderItem}
                    onMomentumScrollEnd={(e) => {
                        const contentOffsetX = e.nativeEvent.contentOffset.x;
                        handleImageChange(contentOffsetX);
                    }}
                    style={{ height }}
                    contentContainerStyle={{ width: containerWidth * images.length }}
                />
            </Animated.View>
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