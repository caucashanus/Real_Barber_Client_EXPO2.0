import React from 'react';
import { View, type ImageSourcePropType } from 'react-native';

import { CardScroller } from '@/components/CardScroller';
import FavoriteMediaCard from '@/components/favorites/FavoriteMediaCard';
import ThemedText from '@/components/ThemedText';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';

const CARD_WIDTH = 148;

export interface HairstylePortraitCarouselItem {
  id: string;
  title: string;
  image: string | ImageSourcePropType;
  href: string;
  entityType?: string;
  entityId?: string;
  showFavorite?: boolean;
}

interface HairstylePortraitCarouselSectionProps {
  title: string;
  items: HairstylePortraitCarouselItem[];
}

export default function HairstylePortraitCarouselSection({
  title,
  items,
}: HairstylePortraitCarouselSectionProps) {
  if (items.length === 0) return null;

  return (
    <View className={BARBER_DETAIL_SECTION_SPACING}>
      <ThemedText className="mb-3 text-lg font-semibold">{title}</ThemedText>
      <CardScroller className="mt-0 pt-0" space={15}>
        {items.map((item) => (
          <View key={item.id} style={{ width: CARD_WIDTH }}>
            <FavoriteMediaCard
              href={item.href}
              title={item.title}
              image={item.image}
              entityType={item.entityType}
              entityId={item.entityId}
              showFavorite={item.showFavorite}
            />
          </View>
        ))}
      </CardScroller>
    </View>
  );
}
