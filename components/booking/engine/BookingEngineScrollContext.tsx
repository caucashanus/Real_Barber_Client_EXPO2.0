import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';

import { scrollAccordionSectionIfNeeded } from '@/components/booking/engine/bookingEngineScroll';

interface BookingEngineScrollContextValue {
  scrollRef: RefObject<ScrollView | null>;
  contentRef: RefObject<View | null>;
  scrollToSectionIfNeeded: (sectionRef: View) => void;
  onScrollViewScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollViewLayout: (height: number) => void;
}

const BookingEngineScrollContext = createContext<BookingEngineScrollContextValue | null>(null);

export function BookingEngineScrollProvider({ children }: { children: ReactNode }) {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const scrollYRef = useRef(0);
  const viewportHeightRef = useRef(0);

  const scrollToSectionIfNeeded = useCallback((sectionRef: View) => {
    scrollAccordionSectionIfNeeded({
      scrollRef,
      contentRef,
      sectionRef,
      scrollY: scrollYRef.current,
      viewportHeight: viewportHeightRef.current,
    });
  }, []);

  const onScrollViewScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const onScrollViewLayout = useCallback((height: number) => {
    viewportHeightRef.current = height;
  }, []);

  const value = useMemo(
    () => ({
      scrollRef,
      contentRef,
      scrollToSectionIfNeeded,
      onScrollViewScroll,
      onScrollViewLayout,
    }),
    [scrollToSectionIfNeeded, onScrollViewScroll, onScrollViewLayout]
  );

  return (
    <BookingEngineScrollContext.Provider value={value}>{children}</BookingEngineScrollContext.Provider>
  );
}

export function useBookingEngineScroll() {
  return useContext(BookingEngineScrollContext);
}
