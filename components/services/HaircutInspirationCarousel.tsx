import React from 'react';
import { ScrollView, View } from 'react-native';

import type { HaircutCarouselItem } from '@/constants/homeCuratedHaircutsCarousel';
import FavoriteMediaCard from '@/components/favorites/FavoriteMediaCard';

const CARD_WIDTH = 148;
const CARD_GAP = 15;

interface HaircutInspirationCarouselProps {
  items: HaircutCarouselItem[];
}

export default function HaircutInspirationCarousel({ items }: HaircutInspirationCarouselProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-global mt-1.5 px-global"
      contentContainerStyle={{ columnGap: CARD_GAP, paddingRight: 24 }}>
      {items.map((item) => (
        <View key={item.id} style={{ width: CARD_WIDTH }}>
          <FavoriteMediaCard
            href={item.href}
            title={item.title}
            image={item.image}
            entityType="item"
            entityId={item.id}
          />
        </View>
      ))}
    </ScrollView>
  );
}
