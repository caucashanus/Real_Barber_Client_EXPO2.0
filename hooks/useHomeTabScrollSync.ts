import { useFocusEffect } from 'expo-router/react-navigation';
import { useCallback, useContext, useMemo, useRef } from 'react';
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from 'react-native';

import { ScrollContext } from '@/app/(tabs)/(home)/_layout';

/** Sdílený scroll offset pro HomeTabs — sync při návratu na tab. */
export function useHomeTabScrollSync() {
  const scrollY = useContext(ScrollContext);
  const scrollRef = useRef<ScrollView>(null);
  const lastOffsetYRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      scrollY.setValue(lastOffsetYRef.current);
    }, [scrollY])
  );

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          lastOffsetYRef.current = event.nativeEvent.contentOffset.y;
        },
      }),
    [scrollY]
  );

  return {
    scrollRef,
    onScroll,
    scrollEventThrottle: 16 as const,
    animatedScroll: true as const,
  };
}
