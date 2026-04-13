import { styled } from 'nativewind';
import React from 'react';
import {
  ScrollView,
  ScrollViewProps,
  View,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

interface ThemeScrollerProps extends ScrollViewProps {
  children: React.ReactNode;
  onScroll?: ((event: NativeSyntheticEvent<NativeScrollEvent>) => void) | any;
  contentContainerStyle?: any;
  scrollEventThrottle?: number;
  headerSpace?: boolean;
}

// Use basic ScrollView instead of styled for better compatibility with Animated
const StyledScrollView = styled(ScrollView);

const ThemedScroller = React.forwardRef<ScrollView, ThemeScrollerProps>(function ThemedScroller(
  {
    children,
    className,
    onScroll,
    contentContainerStyle,
    scrollEventThrottle = 16,
    headerSpace = false,
    ...props
  },
  ref
) {
  return (
    <StyledScrollView
      ref={ref}
      showsVerticalScrollIndicator={false}
      style={{ width: '100%' }}
      //bounces={false}
      overScrollMode="never"
      className={`flex-1 bg-light-primary px-global dark:bg-dark-primary ${className || ''}`}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={[
        headerSpace && { paddingTop: 70 }, // Add space for fixed header
        contentContainerStyle,
      ]}
      {...props}>
      {children}
      <View className="h-20 w-full" />
    </StyledScrollView>
  );
});

export default ThemedScroller;

// Create an Animated version of ScrollView for use with Animated.event
export const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
