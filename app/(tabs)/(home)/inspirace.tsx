import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  fetchPublicInspiracePage,
  type PublicInspiracePageItem} from '@/api/publicInspiracePage';
import AppButton from '@/components/AppButton';
import InspiraceIntroCard from '@/components/inspirace/InspiraceIntroCard';
import ServiceItemGrid from '@/components/services/ServiceItemGrid';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import {
  INSPIRACE_GRID_INITIAL,
  INSPIRACE_GRID_STEP} from '@/constants/inspiraceGrid';
import { useHomeTabScrollSync } from '@/hooks/useHomeTabScrollSync';
import { useTranslation } from '@/hooks/useTranslation';
import SiteLoadingState from '@/components/SiteLoadingState';
import {
  mapInspiraceItemsToGridItems,
  sliceInspiraceGridItems,
  sortInspiraceItems} from '@/utils/inspiracePageHelpers';

const InspiraceScreen = () => {
  const { scrollRef, onScroll, scrollEventThrottle, animatedScroll } = useHomeTabScrollSync();
  const { t, locale } = useTranslation();
  const [allItems, setAllItems] = useState<PublicInspiracePageItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(INSPIRACE_GRID_INITIAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setVisibleCount(INSPIRACE_GRID_INITIAL);
    fetchPublicInspiracePage()
      .then((data) => setAllItems(sortInspiraceItems(data.items, locale)))
      .catch(() => setError(t('inspiraceLoadError')))
      .finally(() => setLoading(false));
  }, [locale, t]);

  const sortedItems = useMemo(
    () => sortInspiraceItems(allItems, locale),
    [allItems, locale]
  );

  const visibleItems = useMemo(
    () => sliceInspiraceGridItems(sortedItems, 0, visibleCount),
    [sortedItems, visibleCount]
  );

  const gridItems = useMemo(
    () => mapInspiraceItemsToGridItems(visibleItems, locale),
    [visibleItems, locale]
  );

  const hasMore = visibleCount < sortedItems.length;

  const handleLoadMore = () => {
    if (!hasMore) return;
    setVisibleCount((current) => Math.min(current + INSPIRACE_GRID_STEP, sortedItems.length));
  };

  return (
    <ThemeScroller
      ref={scrollRef}
      animatedScroll={animatedScroll}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}>
      <View className="mt-4 flex-1">
        {loading ? (
          <SiteLoadingState layout="section" className="py-16" />
        ) : (
          <>
            {error ? (
              <View className="mb-4 items-center px-6">
                <ThemedText className="text-center text-red-500 dark:text-red-400">{error}</ThemedText>
              </View>
            ) : null}

            <InspiraceIntroCard />

            {gridItems.length === 0 ? (
              <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                {t('inspiraceNoItems')}
              </ThemedText>
            ) : (
              <ServiceItemGrid items={gridItems} accentBadgeLabels />
            )}

            {hasMore ? (
              <View className="mt-6 items-center pb-4">
                <AppButton
                  title={t('inspiraceExpandMore')}
                  onPress={handleLoadMore}
                  variant="secondary"
                />
              </View>
            ) : null}
          </>
        )}
      </View>
    </ThemeScroller>
  );
};

export default InspiraceScreen;
