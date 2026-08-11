import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { CardScroller } from '@/components/CardScroller';
import FavoriteMediaCard from '@/components/favorites/FavoriteMediaCard';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';
import type { ServiceGridItem } from '@/components/services/ServiceItemGrid';
import type { TranslationKey } from '@/locales';
import { BREADCRUMB_APP_ROUTES } from '@/utils/breadcrumbs';

const CARD_WIDTH = 148;

interface HairstyleSimilarSectionProps {
  items: ServiceGridItem[];
  t: (key: TranslationKey) => string;
}

export default function HairstyleSimilarSection({ items, t }: HairstyleSimilarSectionProps) {
  const carouselItems = useMemo(
    () => items.filter((item) => item.href),
    [items]
  );

  return (
    <View className={BARBER_DETAIL_SECTION_SPACING}>
      <View className="mb-3 flex-row items-center justify-between">
        <ThemedText className="text-lg font-semibold">{t('inspiraceDetailSimilar')}</ThemedText>
        <SlotTimePill
          title={t('inspiraceDetailBackToInspirace')}
          textClassName="text-sm font-semibold"
          onPress={() => router.push(BREADCRUMB_APP_ROUTES.inspirace)}
        />
      </View>

      {carouselItems.length > 0 ? (
        <CardScroller className="mt-0 pt-0" space={15}>
          {carouselItems.map((item) => (
            <View key={item.id} style={{ width: CARD_WIDTH }}>
              <FavoriteMediaCard
                href={item.href!}
                title={item.title}
                image={item.image}
                entityType={item.entityType}
                entityId={item.entityId}
              />
            </View>
          ))}
        </CardScroller>
      ) : null}
    </View>
  );
}
