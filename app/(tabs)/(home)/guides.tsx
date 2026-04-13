import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View, Pressable, Image, Animated, ActivityIndicator } from 'react-native';

import { ScrollContext } from './_layout';

import { getClientGuides, type ClientGuide } from '@/api/guides';
import { useTranslation } from '@/app/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import Favorite from '@/components/Favorite';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { shadowPresets } from '@/utils/useShadow';

function formatAddedAt(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `přidáno ${day}.${month} ${year}`;
}

function getFirstImageUrl(guide: ClientGuide): string | null {
  const images = (guide.media || [])
    .filter((m) => m.mediaFile?.fileType === 'image' && m.mediaFile?.url)
    .sort((a, b) => a.order - b.order);
  return images.length > 0 ? images[0].mediaFile!.url : null;
}

function GuideCard({ guide }: { guide: ClientGuide }) {
  const imageUrl = getFirstImageUrl(guide);
  const onPress = () =>
    router.push({ pathname: '/screens/guide-detail', params: { id: guide.id } });

  return (
    <Pressable
      onPress={onPress}
      style={{ ...shadowPresets.large }}
      className="mb-8 flex flex-row items-center rounded-2xl bg-light-primary p-5 dark:bg-dark-secondary">
      <View className="flex-1 pr-3">
        <ThemedText className="text-base font-medium" numberOfLines={2}>
          {guide.title}
        </ThemedText>
        <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
          {formatAddedAt(guide.createdAt)}
        </ThemedText>
      </View>
      <View className="relative h-20 w-20">
        {imageUrl ? (
          <View className="h-full w-full overflow-hidden rounded-xl border-2 border-light-primary dark:border-dark-primary">
            <Image className="h-full w-full" source={{ uri: imageUrl }} resizeMode="cover" />
          </View>
        ) : (
          <View className="h-full w-full items-center justify-center rounded-xl border-2 border-light-primary bg-light-secondary dark:border-dark-primary dark:bg-dark-secondary">
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">—</ThemedText>
          </View>
        )}
        <View className="absolute right-1 top-1 z-10">
          <Favorite entityType="guide" entityId={guide.id} title={guide.title} size={20} isWhite />
        </View>
      </View>
    </Pressable>
  );
}

const GuidesScreen = () => {
  const { t } = useTranslation();
  const scrollY = useContext(ScrollContext);
  const [guides, setGuides] = useState<ClientGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getClientGuides()
      .then(setGuides)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ThemeScroller
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      })}
      scrollEventThrottle={16}>
      <AnimatedView animation="scaleIn" className="mt-4 flex-1">
        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" />
            <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
              {t('guidesLoading')}
            </ThemedText>
          </View>
        ) : error ? (
          <View className="items-center px-4 py-12">
            <ThemedText className="mb-4 text-center text-light-subtext dark:text-dark-subtext">
              {error}
            </ThemedText>
          </View>
        ) : guides.length === 0 ? (
          <View className="items-center px-4 py-12">
            <ThemedText className="text-center text-light-subtext dark:text-dark-subtext">
              {t('guidesNoGuides')}
            </ThemedText>
          </View>
        ) : (
          guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)
        )}
      </AnimatedView>
    </ThemeScroller>
  );
};

export default GuidesScreen;
