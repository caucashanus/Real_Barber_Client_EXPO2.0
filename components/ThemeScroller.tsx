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
  /** Bottom spacer for tab bar clearance (default true). */
  footerSpacer?: boolean;
  /** Animated ScrollView pro `Animated.event` (home tabs + menu). */
  animatedScroll?: boolean;
}

const StyledScrollView = styled(ScrollView);
const StyledAnimatedScrollView = styled(Animated.createAnimatedComponent(ScrollView));

const ThemedScroller = React.forwardRef<ScrollView, ThemeScrollerProps>(function ThemedScroller(
  {
    children,
    className,
    onScroll,
    contentContainerStyle,
    scrollEventThrottle = 16,
    headerSpace = false,
    footerSpacer = true,
    animatedScroll = false,
    ...props
  },
  ref
) {
  const ScrollComponent = animatedScroll ? StyledAnimatedScrollView : StyledScrollView;

  return (
    <ScrollComponent
      ref={ref as never}
      showsVerticalScrollIndicator={false}
      style={{ width: '100%' }}
      overScrollMode="never"
      className={`flex-1 bg-light-primary px-global dark:bg-dark-primary ${className || ''}`}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={[
        headerSpace && { paddingTop: 70 },
        contentContainerStyle,
      ]}
      {...props}>
      {children}
      {footerSpacer ? <View className="h-20 w-full" /> : null}
    </ScrollComponent>
  );
});

export default ThemedScroller;

export const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
