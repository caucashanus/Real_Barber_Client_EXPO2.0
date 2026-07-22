import type { RefObject } from 'react';
import type { ScrollView, View } from 'react-native';

/** Offset pod sticky progress barem (parity s web scroll-mt-24 ≈ 96px). */
export const BOOKING_ENGINE_STICKY_SCROLL_OFFSET = 96;

/** Druhý scroll pass po expand animaci (parity s webem). */
export const BOOKING_ENGINE_ACCORDION_SCROLL_DELAY_MS = 220;

const VISIBILITY_TOLERANCE_PX = 8;
const MIN_VISIBLE_HEADER_PX = 40;

interface ScrollToSectionIfNeededParams {
  scrollRef: RefObject<ScrollView | null>;
  contentRef: RefObject<View | null>;
  sectionRef: View;
  scrollY: number;
  viewportHeight: number;
  topOffset?: number;
}

export function scrollAccordionSectionIfNeeded({
  scrollRef,
  contentRef,
  sectionRef,
  scrollY,
  viewportHeight,
  topOffset = BOOKING_ENGINE_STICKY_SCROLL_OFFSET,
}: ScrollToSectionIfNeededParams): void {
  const contentNode = contentRef.current;
  if (!contentNode || viewportHeight <= 0) return;

  sectionRef.measureLayout(
    contentNode,
    (_x, sectionTop, _width, _sectionHeight) => {
      const stickyLine = scrollY + topOffset;
      const viewportBottom = scrollY + viewportHeight;

      const isSufficientlyVisible =
        sectionTop >= stickyLine - VISIBILITY_TOLERANCE_PX &&
        sectionTop <= viewportBottom - MIN_VISIBLE_HEADER_PX;

      if (isSufficientlyVisible) return;

      scrollRef.current?.scrollTo({
        y: Math.max(0, sectionTop - topOffset),
        animated: true,
      });
    },
    () => {
      // measureLayout failed — skip scroll
    }
  );
}
