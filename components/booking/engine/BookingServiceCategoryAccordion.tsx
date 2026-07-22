import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View, type View as RNView } from 'react-native';

import Icon from '@/components/Icon';
import { BOOKING_ENGINE_ACCORDION_SCROLL_DELAY_MS } from '@/components/booking/engine/bookingEngineScroll';
import { useBookingEngineScroll } from '@/components/booking/engine/BookingEngineScrollContext';
import Divider from '@/components/layout/Divider';
import ThemedText from '@/components/ThemedText';
import type { ServicesByCategory } from '@/lib/booking/bookingWizardTypes';
import type { BookingService } from '@/lib/booking/constants';

interface BookingServiceCategoryAccordionProps {
  categories: ServicesByCategory[];
  renderServices: (services: BookingService[]) => React.ReactNode;
}

export default function BookingServiceCategoryAccordion({
  categories,
  renderServices,
}: BookingServiceCategoryAccordionProps) {
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const bookingScroll = useBookingEngineScroll();
  const sectionRefs = useRef<Record<string, RNView | null>>({});
  const shouldScrollOnOpenRef = useRef(false);

  const scrollToOpenSection = useCallback(() => {
    if (!openCategoryId || !bookingScroll) return;
    const sectionNode = sectionRefs.current[openCategoryId];
    if (sectionNode) {
      bookingScroll.scrollToSectionIfNeeded(sectionNode);
    }
  }, [bookingScroll, openCategoryId]);

  useEffect(() => {
    if (!openCategoryId || !shouldScrollOnOpenRef.current) return;

    shouldScrollOnOpenRef.current = false;

    const frame = requestAnimationFrame(() => {
      scrollToOpenSection();
    });
    const delayed = setTimeout(scrollToOpenSection, BOOKING_ENGINE_ACCORDION_SCROLL_DELAY_MS);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(delayed);
    };
  }, [openCategoryId, scrollToOpenSection]);

  const handleToggle = (categoryId: string) => {
    setOpenCategoryId((current) => {
      if (current === categoryId) {
        return null;
      }
      shouldScrollOnOpenRef.current = true;
      return categoryId;
    });
  };

  return (
    <View>
      {categories.map((category, index) => {
        const isOpen = openCategoryId === category.categoryId;
        return (
          <View
            key={category.categoryId}
            ref={(node) => {
              sectionRefs.current[category.categoryId] = node;
            }}
            collapsable={false}>
            {index > 0 ? <Divider spacing={8} /> : null}
            <Pressable
              className={`flex-row items-center justify-between py-3 active:opacity-80${
                index === 0 ? ' mt-4' : ''
              }`}
              onPress={() => handleToggle(category.categoryId)}>
              <ThemedText className="text-base font-medium">{category.categoryName}</ThemedText>
              <Icon
                name={isOpen ? 'ChevronUp' : 'ChevronDown'}
                size={18}
                className="text-light-subtext dark:text-dark-subtext"
              />
            </Pressable>
            {isOpen ? <View>{renderServices(category.services)}</View> : null}
          </View>
        );
      })}
    </View>
  );
}
