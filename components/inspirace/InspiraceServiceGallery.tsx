import React, { useMemo, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MediaFullscreenModal from '@/components/detail/MediaFullscreenModal';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface InspiraceServiceGalleryProps {
  images: { url: string; alt: string }[];
  t: (key: TranslationKey) => string;
}

export default function InspiraceServiceGallery({ images, t }: InspiraceServiceGalleryProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tileSize = Math.floor((width - 48 - 8) / 2);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeMedia = useMemo(
    () =>
      activeIndex != null && images[activeIndex]
        ? { url: images[activeIndex].url, type: 'image' as const }
        : null,
    [activeIndex, images]
  );

  if (images.length <= 1) return null;

  return (
    <View>
      <ThemedText className="mb-3 text-lg font-semibold">{t('inspiraceDetailGallery')}</ThemedText>
      <View className="flex-row flex-wrap gap-2">
        {images.map((image, index) => (
          <Pressable
            key={`${image.url}-${index}`}
            onPress={() => setActiveIndex(index)}
            className="overflow-hidden rounded-xl active:opacity-80"
            style={{ width: tileSize, height: tileSize }}>
            <Image source={{ uri: image.url }} className="h-full w-full" contentFit="cover" />
          </Pressable>
        ))}
      </View>

      <MediaFullscreenModal
        media={activeMedia}
        winWidth={width}
        winHeight={height}
        topInset={insets.top}
        onClose={() => setActiveIndex(null)}
      />
    </View>
  );
}
